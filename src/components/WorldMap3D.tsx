import React, {useEffect, useMemo, useState} from 'react';
import {
  AltitudeMode,
  GestureHandling,
  Map3D,
  MapMode,
} from '@vis.gl/react-google-maps';
import {Model3D} from '@vis.gl/react-google-maps/3d';
import {COVENTRY_START} from '../constants/worldPresets';
import type {CameraPresetId, TimeOfDay} from '../types/drive';
import {createCarGlbUrl} from '../utils/carGlbGenerator';

interface WorldMap3DProps {
  timeOfDay: TimeOfDay;
  showLabels: boolean;
  cameraPreset: CameraPresetId;
  model3dRef: React.RefObject<google.maps.maps3d.Model3DElement | null>;
  onManualOrbit: () => void;
  onMapError: (message: string) => void;
}

export const WorldMap3D: React.FC<WorldMap3DProps> = ({
  timeOfDay,
  showLabels,
  cameraPreset,
  model3dRef,
  onManualOrbit,
  onMapError,
}) => {
  const [webglError, setWebglError] = useState<string | null>(null);

  const carGlbUrl = useMemo(() => createCarGlbUrl(), []);
  const initialModelPosition = useMemo(
    () => ({
      lat: COVENTRY_START.lat,
      lng: COVENTRY_START.lng,
      altitude: 0.25,
    }),
    []
  );
  const initialModelOrientation = useMemo(
    () => ({
      heading: COVENTRY_START.heading,
      tilt: 0,
      roll: 0,
    }),
    []
  );
  const initialMapCenter = useMemo(
    () => ({
      lat: COVENTRY_START.lat,
      lng: COVENTRY_START.lng,
      altitude: 87,
    }),
    []
  );

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(carGlbUrl);
    };
  }, [carGlbUrl]);

  // Detect WebGL2 capability gracefully so headless or unsupported browsers show a clear state
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        const msg =
          'WebGL2 is required for Photorealistic 3D Maps in this browser.';
        setWebglError(msg);
        onMapError(msg);
      }
    } catch {
      const msg = 'Unable to initialize 3D graphics context.';
      setWebglError(msg);
      onMapError(msg);
    }
  }, [onMapError]);

  const hideCar = cameraPreset === 'hood';

  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-200 p-8">
        <div className="max-w-md border border-white/10 bg-zinc-900/80 p-6 rounded-xl text-center space-y-2">
          <h2 className="font-display text-xl font-bold text-amber-400">
            3D Viewport Unavailable
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{webglError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950">
      <div
        className={`w-full h-full ${
          timeOfDay === 'night'
            ? 'world-drive-3d-night'
            : 'world-drive-3d-day'
        }`}
      >
        <Map3D
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mode={showLabels ? MapMode.HYBRID : MapMode.SATELLITE}
          gestureHandling={GestureHandling.GREEDY}
          defaultUIHidden={true}
          defaultCenter={initialMapCenter}
          defaultRange={34}
          defaultHeading={COVENTRY_START.heading}
          defaultTilt={74}
          defaultRoll={0}
          onCameraChanged={onManualOrbit}
          onError={() =>
            onMapError(
              'Photorealistic 3D imagery encountered a loading error. Check Maps JavaScript API availability.'
            )
          }
          style={{width: '100%', height: '100%'}}
        >
          <Model3D
            ref={model3dRef}
            src={carGlbUrl}
            position={initialModelPosition}
            altitudeMode={AltitudeMode.RELATIVE_TO_GROUND}
            orientation={initialModelOrientation}
            scale={hideCar ? 0.001 : 1.15}
          />
        </Map3D>
      </div>

      {/* Night mode atmospheric sky gradient, peripheral vignette & headlight beams */}
      {timeOfDay === 'night' && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden="true"
        >
          <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-slate-950/85 via-slate-950/35 to-transparent" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 56%, transparent 38%, rgba(5, 8, 18, 0.58) 100%)',
            }}
          />
          {cameraPreset !== 'aerial' && (
            <div
              className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-[360px] h-[240px] opacity-40"
              style={{
                background:
                  'conic-gradient(from 334deg at 50% 82%, transparent 0deg, rgba(254, 240, 198, 0.28) 16deg, rgba(254, 240, 198, 0.08) 26deg, rgba(254, 240, 198, 0.28) 36deg, transparent 52deg)',
                filter: 'blur(12px)',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
