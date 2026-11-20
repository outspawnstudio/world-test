import {useCallback, useEffect, useRef, useState} from 'react';
import {useMap3D, useMapsLibrary} from '@vis.gl/react-google-maps';
import {
  CAMERA_PRESETS,
  CAMERA_PRESET_ORDER,
  COVENTRY_START,
} from '../constants/worldPresets';
import type {
  CameraPresetId,
  TelemetrySnapshot,
  TouchInputState,
  VehiclePose,
} from '../types/drive';
import {
  computeGearLabel,
  haversineMeters,
  moveLatLng,
  normalizeHeading,
} from '../utils/geoMath';

const MAX_CRUISE_SPEED_MS = 38; // ~136 km/h standard drive
const MAX_BOOST_SPEED_MS = 68; // ~245 km/h boost mode for sweeping city exploration
const MAX_REVERSE_SPEED_MS = -14; // ~50 km/h reverse
const ACCEL_RATE = 22; // m/s^2
const BOOST_ACCEL_RATE = 38;
const BRAKE_DECEL = 42;
const HANDBRAKE_DECEL = 58;
const COAST_DRAG = 8.5;
const TURN_RATE_DEG = 86; // deg/s at responsive speed

interface UseDriveControllerOptions {
  cameraPreset: CameraPresetId;
  onCycleCamera: () => void;
  model3dRef: React.RefObject<google.maps.maps3d.Model3DElement | null>;
}

export function useDriveController({
  cameraPreset,
  onCycleCamera,
  model3dRef,
}: UseDriveControllerOptions) {
  const map3d = useMap3D();
  const elevationLib = useMapsLibrary('elevation');
  const elevatorRef = useRef<google.maps.ElevationService | null>(null);

  // In-memory spatial elevation cache (session only, clears on reload)
  const elevCacheRef = useRef<Record<string, number>>({});
  const lastElevQueryPosRef = useRef<{lat: number; lng: number; time: number}>({
    lat: COVENTRY_START.lat,
    lng: COVENTRY_START.lng,
    time: 0,
  });
  const targetGroundAltRef = useRef<number>(85); // Coventry city centre ~85m MSL initial guess

  const poseRef = useRef<VehiclePose>({
    lat: COVENTRY_START.lat,
    lng: COVENTRY_START.lng,
    groundAltitude: 85,
    heading: COVENTRY_START.heading,
    speedMs: 0,
    steeringAngle: 0,
    rollAngle: 0,
    throttle: 0,
    braking: false,
    boosting: false,
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef<TouchInputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    brake: false,
  });

  const cameraPresetRef = useRef<CameraPresetId>(cameraPreset);
  useEffect(() => {
    cameraPresetRef.current = cameraPreset;
  }, [cameraPreset]);

  const onCycleCameraRef = useRef(onCycleCamera);
  useEffect(() => {
    onCycleCameraRef.current = onCycleCamera;
  }, [onCycleCamera]);

  const cameraActiveRef = useRef<boolean>(true);
  const smoothedCamHeadingRef = useRef<number>(COVENTRY_START.heading);
  const lastHudSyncRef = useRef<number>(0);

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>({
    lat: COVENTRY_START.lat,
    lng: COVENTRY_START.lng,
    groundAltitude: 85,
    heading: COVENTRY_START.heading,
    speedKmh: 0,
    speedMph: 0,
    gear: 'N',
    rpmRatio: 0.12,
    braking: false,
    boosting: false,
    steeringAngle: 0,
    isMoving: false,
  });

  const [isTeleporting, setIsTeleporting] = useState(false);

  // Initialize ElevationService when library loads and sample Coventry starting altitude
  const fetchElevationAt = useCallback(
    async (lat: number, lng: number): Promise<number | null> => {
      if (!elevationLib) return null;
      if (!elevatorRef.current) {
        elevatorRef.current = new elevationLib.ElevationService();
      }
      const cacheKey = `${Math.round(lat * 3200)}_${Math.round(lng * 3200)}`;
      if (cacheKey in elevCacheRef.current) {
        return elevCacheRef.current[cacheKey];
      }

      try {
        const res = await elevatorRef.current.getElevationForLocations({
          locations: [{lat, lng}],
        });
        const elev = res?.results?.[0]?.elevation;
        if (typeof elev === 'number' && Number.isFinite(elev)) {
          elevCacheRef.current[cacheKey] = elev;
          return elev;
        }
      } catch (err) {
        console.warn('Elevation lookup failed, retaining current altitude:', err);
      }
      return null;
    },
    [elevationLib]
  );

  useEffect(() => {
    if (!elevationLib) return;
    let active = true;
    void fetchElevationAt(poseRef.current.lat, poseRef.current.lng).then(
      (elev) => {
        if (active && elev !== null) {
          targetGroundAltRef.current = elev;
          poseRef.current.groundAltitude = elev;
          setTelemetry((prev) => ({
            ...prev,
            groundAltitude: Math.round(elev),
          }));
        }
      }
    );
    return () => {
      active = false;
    };
  }, [elevationLib, fetchElevationAt]);

  const applyCameraAndModel = useCallback(
    (pose: VehiclePose, presetId: CameraPresetId) => {
      const preset = CAMERA_PRESETS[presetId];
      const speedRatio = Math.min(1, Math.abs(pose.speedMs) / MAX_BOOST_SPEED_MS);

      if (map3d) {
        map3d.center = {
          lat: pose.lat,
          lng: pose.lng,
          altitude: pose.groundAltitude + preset.altitudeOffset,
        };
        map3d.heading = smoothedCamHeadingRef.current;
        map3d.tilt = preset.baseTilt;
        map3d.range = preset.baseRange + speedRatio * preset.maxSpeedRangeBonus;
        map3d.roll = pose.rollAngle;
        // Adjust dynamic FOV subtly with speed when supported
        if ('fov' in map3d) {
          (map3d as unknown as {fov: number}).fov =
            preset.baseFov + speedRatio * preset.maxFovBonus;
        }
      }

      if (model3dRef.current) {
        model3dRef.current.position = {
          lat: pose.lat,
          lng: pose.lng,
          altitude: 0.25,
        };
        model3dRef.current.orientation = {
          heading: pose.heading,
          tilt: 0,
          roll: -pose.rollAngle * 0.6,
        };
      }
    },
    [map3d, model3dRef]
  );

  // Snap camera immediately when preset changes
  useEffect(() => {
    cameraActiveRef.current = true;
    smoothedCamHeadingRef.current = poseRef.current.heading;
    applyCameraAndModel(poseRef.current, cameraPreset);
  }, [cameraPreset, applyCameraAndModel]);

  const snapCameraToVehicle = useCallback(() => {
    cameraActiveRef.current = true;
    smoothedCamHeadingRef.current = poseRef.current.heading;
    applyCameraAndModel(poseRef.current, cameraPresetRef.current);
  }, [applyCameraAndModel]);

  const teleportTo = useCallback(
    async (lat: number, lng: number, heading?: number) => {
      setIsTeleporting(true);
      const pose = poseRef.current;
      pose.speedMs = 0;
      pose.steeringAngle = 0;
      pose.rollAngle = 0;
      pose.lat = lat;
      pose.lng = lng;
      if (typeof heading === 'number') {
        pose.heading = normalizeHeading(heading);
        smoothedCamHeadingRef.current = pose.heading;
      }

      const sampledElev = await fetchElevationAt(lat, lng);
      const nextAlt = sampledElev ?? pose.groundAltitude;
      targetGroundAltRef.current = nextAlt;
      pose.groundAltitude = nextAlt;

      lastElevQueryPosRef.current = {lat, lng, time: performance.now()};
      cameraActiveRef.current = true;

      const preset = CAMERA_PRESETS[cameraPresetRef.current];
      if (map3d) {
        map3d.stopCameraAnimation();
        map3d.flyCameraTo({
          endCamera: {
            center: {
              lat,
              lng,
              altitude: nextAlt + preset.altitudeOffset,
            },
            range: preset.baseRange,
            heading: pose.heading,
            tilt: preset.baseTilt,
            roll: 0,
          },
          durationMillis: 1400,
        });
      }

      if (model3dRef.current) {
        model3dRef.current.position = {lat, lng, altitude: 0.25};
        model3dRef.current.orientation = {
          heading: pose.heading,
          tilt: 0,
          roll: 0,
        };
      }

      setTelemetry({
        lat,
        lng,
        groundAltitude: Math.round(nextAlt),
        heading: pose.heading,
        speedKmh: 0,
        speedMph: 0,
        gear: 'N',
        rpmRatio: 0.12,
        braking: false,
        boosting: false,
        steeringAngle: 0,
        isMoving: false,
      });

      window.setTimeout(() => setIsTeleporting(false), 1450);
    },
    [fetchElevationAt, map3d, model3dRef]
  );

  // Keyboard listeners
  useEffect(() => {
    const isTypingInField = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingInField(e.target)) return;

      const code = e.code;
      if (
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight' ||
        code === 'Space'
      ) {
        e.preventDefault();
      }

      if (code === 'KeyC' && !e.repeat) {
        onCycleCameraRef.current();
        return;
      }

      keysRef.current[code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const onBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Main 60fps driving simulation & camera chase loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const keys = keysRef.current;
      const touch = touchRef.current;

      const throttleForward =
        keys['KeyW'] || keys['ArrowUp'] || touch.forward ? 1 : 0;
      const throttleBackward =
        keys['KeyS'] || keys['ArrowDown'] || touch.backward ? 1 : 0;
      const steerLeft = keys['KeyA'] || keys['ArrowLeft'] || touch.left ? 1 : 0;
      const steerRight =
        keys['KeyD'] || keys['ArrowRight'] || touch.right ? 1 : 0;
      const handbrake = Boolean(keys['Space'] || touch.brake);
      const boost = Boolean(
        keys['ShiftLeft'] || keys['ShiftRight'] || touch.boost
      );

      const hasDriveInput =
        throttleForward > 0 ||
        throttleBackward > 0 ||
        steerLeft > 0 ||
        steerRight > 0 ||
        handbrake;

      const pose = poseRef.current;

      if (hasDriveInput && !cameraActiveRef.current) {
        cameraActiveRef.current = true;
      }

      // Longitudinal acceleration / braking / coasting
      const maxForward = boost ? MAX_BOOST_SPEED_MS : MAX_CRUISE_SPEED_MS;
      let isBraking = false;

      if (handbrake) {
        isBraking = true;
        if (Math.abs(pose.speedMs) < 0.8) {
          pose.speedMs = 0;
        } else {
          pose.speedMs -= Math.sign(pose.speedMs) * HANDBRAKE_DECEL * dt;
        }
      } else if (throttleForward > 0) {
        if (pose.speedMs < -0.5) {
          isBraking = true;
          pose.speedMs += BRAKE_DECEL * dt;
        } else {
          const accel = boost ? BOOST_ACCEL_RATE : ACCEL_RATE;
          pose.speedMs = Math.min(maxForward, pose.speedMs + accel * dt);
        }
      } else if (throttleBackward > 0) {
        if (pose.speedMs > 0.5) {
          isBraking = true;
          pose.speedMs = Math.max(0, pose.speedMs - BRAKE_DECEL * dt);
        } else {
          pose.speedMs = Math.max(
            MAX_REVERSE_SPEED_MS,
            pose.speedMs - ACCEL_RATE * 0.65 * dt
          );
        }
      } else {
        // Aerodynamic & rolling drag
        if (Math.abs(pose.speedMs) < 0.15) {
          pose.speedMs = 0;
        } else {
          const drag = COAST_DRAG * (0.4 + Math.abs(pose.speedMs) / 40);
          const next = pose.speedMs - Math.sign(pose.speedMs) * drag * dt;
          pose.speedMs =
            Math.sign(next) !== Math.sign(pose.speedMs) ? 0 : next;
        }
      }

      // Steering with speed-sensitive authority (allows gentle pivot when stationary too)
      const rawSteer = steerRight - steerLeft;
      pose.steeringAngle += (rawSteer - pose.steeringAngle) * Math.min(1, dt * 10);

      const speedFactor =
        Math.abs(pose.speedMs) < 1
          ? 0.48
          : Math.min(1.15, 0.55 + Math.abs(pose.speedMs) / 26);
      const reverseSign = pose.speedMs < -0.5 ? -1 : 1;

      if (Math.abs(pose.steeringAngle) > 0.005) {
        pose.heading = normalizeHeading(
          pose.heading + pose.steeringAngle * TURN_RATE_DEG * speedFactor * reverseSign * dt
        );
      }

      // Dynamic camera chase roll and damped heading follow
      const targetRoll =
        pose.steeringAngle *
        Math.min(1, Math.abs(pose.speedMs) / 28) *
        (cameraPresetRef.current === 'hood' ? 1.8 : 2.6);
      pose.rollAngle += (targetRoll - pose.rollAngle) * Math.min(1, dt * 7);

      // Smooth camera lag behind steering for third-person inertia
      const headingDelta =
        ((pose.heading - smoothedCamHeadingRef.current + 540) % 360) - 180;
      smoothedCamHeadingRef.current = normalizeHeading(
        smoothedCamHeadingRef.current + headingDelta * Math.min(1, dt * 7.5)
      );

      // Advance geodesic position
      if (Math.abs(pose.speedMs) > 0.05) {
        const nextPos = moveLatLng(
          pose.lat,
          pose.lng,
          pose.heading,
          pose.speedMs * dt
        );
        pose.lat = nextPos.lat;
        pose.lng = nextPos.lng;

        // Throttled elevation sampling
        const distFromLast = haversineMeters(
          pose.lat,
          pose.lng,
          lastElevQueryPosRef.current.lat,
          lastElevQueryPosRef.current.lng
        );
        if (
          distFromLast > 28 &&
          now - lastElevQueryPosRef.current.time > 550
        ) {
          lastElevQueryPosRef.current = {lat: pose.lat, lng: pose.lng, time: now};
          void fetchElevationAt(pose.lat, pose.lng).then((elev) => {
            if (elev !== null) {
              targetGroundAltRef.current = elev;
            }
          });
        }
      }

      // Smoothly interpolate ground altitude
      pose.groundAltitude +=
        (targetGroundAltRef.current - pose.groundAltitude) * Math.min(1, dt * 3.5);
      pose.braking = isBraking;
      pose.boosting = boost && throttleForward > 0;

      const isMoving = Math.abs(pose.speedMs) > 0.1 || hasDriveInput;
      if (cameraActiveRef.current && (isMoving || Math.abs(pose.rollAngle) > 0.02)) {
        applyCameraAndModel(pose, cameraPresetRef.current);
      }

      // Sync lightweight HUD telemetry at ~25Hz
      if (now - lastHudSyncRef.current > 40) {
        lastHudSyncRef.current = now;
        const absMs = Math.abs(pose.speedMs);
        const speedKmh = Math.round(absMs * 3.6);
        const speedMph = Math.round(absMs * 2.23694);
        const {gear, rpmRatio} = computeGearLabel(pose.speedMs, isBraking);

        setTelemetry({
          lat: pose.lat,
          lng: pose.lng,
          groundAltitude: Math.round(pose.groundAltitude),
          heading: Math.round(pose.heading),
          speedKmh,
          speedMph,
          gear,
          rpmRatio,
          braking: isBraking,
          boosting: pose.boosting,
          steeringAngle: pose.steeringAngle,
          isMoving: absMs > 0.2,
        });
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [applyCameraAndModel, fetchElevationAt]);

  const setTouchControl = useCallback(
    (control: keyof TouchInputState, active: boolean) => {
      touchRef.current[control] = active;
    },
    []
  );

  const cyclePresetNext = useCallback(
    (current: CameraPresetId): CameraPresetId => {
      const idx = CAMERA_PRESET_ORDER.indexOf(current);
      return CAMERA_PRESET_ORDER[(idx + 1) % CAMERA_PRESET_ORDER.length];
    },
    []
  );

  const pauseCameraAutoFollow = useCallback(() => {
    if (Math.abs(poseRef.current.speedMs) < 0.5) {
      cameraActiveRef.current = false;
    }
  }, []);

  return {
    telemetry,
    isTeleporting,
    teleportTo,
    snapCameraToVehicle,
    setTouchControl,
    cyclePresetNext,
    pauseCameraAutoFollow,
  };
}
