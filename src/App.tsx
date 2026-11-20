import React, {useCallback, useRef, useState} from 'react';
import {
  APILoadingStatus,
  APIProvider,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import {HudControlsBar} from './components/HudControlsBar';
import {LocationSearchBar} from './components/LocationSearchBar';
import {MinimapRadar} from './components/MinimapRadar';
import {SpeedometerHud} from './components/SpeedometerHud';
import {TechArchitectureModal} from './components/TechArchitectureModal';
import {TouchDrivePad} from './components/TouchDrivePad';
import {WorldMap3D} from './components/WorldMap3D';
import {COVENTRY_START} from './constants/worldPresets';
import {useDriveController} from './hooks/useDriveController';
import type {
  ActiveLocationInfo,
  CameraPresetId,
  SpeedUnit,
  TimeOfDay,
} from './types/drive';

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
const MAPS_LIBRARIES = ['maps3d', 'places', 'elevation', 'marker'];

const WorldDriveCockpit: React.FC = () => {
  const apiStatus = useApiLoadingStatus();
  const model3dRef = useRef<google.maps.maps3d.Model3DElement | null>(null);

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('chase');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('kmh');
  const [showTouchPad, setShowTouchPad] = useState<boolean>(false);
  const [techModalOpen, setTechModalOpen] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<ActiveLocationInfo>({
    name: COVENTRY_START.name,
    subtitle: COVENTRY_START.subtitle,
    lat: COVENTRY_START.lat,
    lng: COVENTRY_START.lng,
  });

  const handleCycleCamera = useCallback(() => {
    setCameraPreset((prev) => {
      const order: CameraPresetId[] = ['chase', 'wide', 'aerial', 'hood'];
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, []);

  const {
    telemetry,
    isTeleporting,
    teleportTo,
    snapCameraToVehicle,
    setTouchControl,
    pauseCameraAutoFollow,
  } = useDriveController({
    cameraPreset,
    onCycleCamera: handleCycleCamera,
    model3dRef,
  });

  const handleSelectDestination = useCallback(
    (
      lat: number,
      lng: number,
      name: string,
      subtitle: string,
      heading?: number
    ) => {
      setActiveLocation({name, subtitle, lat, lng});
      void teleportTo(lat, lng, heading);
    },
    [teleportTo]
  );

  const handleToggleUnit = useCallback(() => {
    setSpeedUnit((prev) => (prev === 'kmh' ? 'mph' : 'kmh'));
  }, []);

  const hasApiError =
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950">
      {/* Full-Viewport Photorealistic 3D Map */}
      <WorldMap3D
        timeOfDay={timeOfDay}
        showLabels={showLabels}
        cameraPreset={cameraPreset}
        model3dRef={model3dRef}
        onManualOrbit={pauseCameraAutoFollow}
        onMapError={setMapError}
      />

      {/* API / Map Error Banner (Standard Production Handling) */}
      {(hasApiError || mapError) && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] rounded-xl border border-red-500/35 bg-zinc-950/95 px-4 py-3 text-xs text-red-200 shadow-2xl backdrop-blur-md"
        >
          {mapError ||
            'Unable to load Google Maps Platform services. Verify your API key configuration, billing status, and enabled Maps JavaScript, Places, and Elevation APIs.'}
        </div>
      )}

      {/* GTA-Inspired Floating HUD Layer */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
        {/* Top Row: Brand & Worldwide Search (Left) + Environment/Camera Controls (Right) */}
        <header className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-3">
          <LocationSearchBar
            activeLocation={activeLocation}
            isTeleporting={isTeleporting}
            onSelectDestination={handleSelectDestination}
          />
          <HudControlsBar
            timeOfDay={timeOfDay}
            onChangeTimeOfDay={setTimeOfDay}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels((prev) => !prev)}
            cameraPreset={cameraPreset}
            onChangeCameraPreset={setCameraPreset}
            onRecenterCamera={snapCameraToVehicle}
            showTouchPad={showTouchPad}
            onToggleTouchPad={() => setShowTouchPad((prev) => !prev)}
            onOpenTechModal={() => setTechModalOpen(true)}
          />
        </header>

        {/* Bottom Row: Synchronized Minimap (Left) + Optional Touch Pad (Center) + Speedometer (Right) */}
        <footer className="flex items-end justify-between gap-3">
          <div className="pointer-events-auto">
            <MinimapRadar
              telemetry={telemetry}
              timeOfDay={timeOfDay}
              locationInfo={activeLocation}
            />
          </div>

          <div className="hidden md:flex items-end justify-center pb-1">
            <TouchDrivePad
              visible={showTouchPad}
              onControlChange={setTouchControl}
            />
          </div>

          <div className="pointer-events-auto">
            <SpeedometerHud
              telemetry={telemetry}
              speedUnit={speedUnit}
              onToggleUnit={handleToggleUnit}
            />
          </div>
        </footer>
      </div>

      {/* Mobile Touch Pad Floating Row when enabled */}
      {showTouchPad && (
        <div className="md:hidden fixed bottom-[210px] left-1/2 -translate-x-1/2 z-30">
          <TouchDrivePad visible={true} onControlChange={setTouchControl} />
        </div>
      )}

      <TechArchitectureModal
        isOpen={techModalOpen}
        onClose={() => setTechModalOpen(false)}
      />
    </main>
  );
};

export default function App() {
  if (!MAPS_API_KEY) {
    return (
      <main className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md rounded-2xl border border-white/15 bg-zinc-900/90 p-6 space-y-3 shadow-2xl">
          <h1 className="font-display text-xl font-bold text-white">
            WORLD<span className="text-amber-400">//</span>DRIVE
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Google Maps Platform API key is not configured. Set{' '}
            <code className="font-mono-tech text-amber-300">
              VITE_GOOGLE_MAPS_API_KEY
            </code>{' '}
            in your environment to launch the 3D world explorer.
          </p>
        </div>
      </main>
    );
  }

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      version="alpha"
      libraries={MAPS_LIBRARIES}
      language="en"
      region="GB"
    >
      <WorldDriveCockpit />
    </APIProvider>
  );
}
