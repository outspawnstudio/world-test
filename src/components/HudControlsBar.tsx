import React from 'react';
import {
  Camera,
  Crosshair,
  Gamepad2,
  Info,
  Layers,
  Moon,
  Sun,
} from 'lucide-react';
import {CAMERA_PRESETS, CAMERA_PRESET_ORDER} from '../constants/worldPresets';
import type {CameraPresetId, TimeOfDay} from '../types/drive';

interface HudControlsBarProps {
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (mode: TimeOfDay) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  cameraPreset: CameraPresetId;
  onChangeCameraPreset: (preset: CameraPresetId) => void;
  onRecenterCamera: () => void;
  showTouchPad: boolean;
  onToggleTouchPad: () => void;
  onOpenTechModal: () => void;
}

export const HudControlsBar: React.FC<HudControlsBarProps> = ({
  timeOfDay,
  onChangeTimeOfDay,
  showLabels,
  onToggleLabels,
  cameraPreset,
  onChangeCameraPreset,
  onRecenterCamera,
  showTouchPad,
  onToggleTouchPad,
  onOpenTechModal,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pointer-events-auto">
      {/* Day / Night Segmented Control */}
      <div
        role="group"
        aria-label="Time of day lighting"
        className="flex items-center p-1 rounded-xl border border-white/15 bg-zinc-950/85 backdrop-blur-md shadow-xl"
      >
        <button
          type="button"
          onClick={() => onChangeTimeOfDay('day')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            timeOfDay === 'day'
              ? 'bg-amber-400 text-zinc-950 font-semibold'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Day</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeTimeOfDay('night')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            timeOfDay === 'night'
              ? 'bg-sky-500 text-zinc-950 font-semibold'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Night</span>
        </button>
      </div>

      {/* Camera Preset Segmented Bar */}
      <div
        role="group"
        aria-label="Camera angle presets"
        className="hidden sm:flex items-center p-1 rounded-xl border border-white/15 bg-zinc-950/85 backdrop-blur-md shadow-xl"
      >
        <span className="px-2 text-zinc-400" aria-hidden="true">
          <Camera className="w-3.5 h-3.5" />
        </span>
        {CAMERA_PRESET_ORDER.map((id) => {
          const preset = CAMERA_PRESETS[id];
          const active = cameraPreset === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeCameraPreset(id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white/15 text-amber-400 font-semibold'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Compact Utility Action Buttons */}
      <div className="flex items-center p-1 gap-1 rounded-xl border border-white/15 bg-zinc-950/85 backdrop-blur-md shadow-xl">
        <button
          type="button"
          onClick={onToggleLabels}
          title="Toggle street names & map labels"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showLabels
              ? 'bg-white/15 text-white'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {showLabels ? 'Labels' : 'Clean 3D'}
          </span>
        </button>

        <button
          type="button"
          onClick={onRecenterCamera}
          title="Snap camera behind vehicle"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-amber-400 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Recenter</span>
        </button>

        <button
          type="button"
          onClick={onToggleTouchPad}
          title="Toggle on-screen drive controls"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showTouchPad
              ? 'bg-amber-400/20 text-amber-300'
              : 'text-zinc-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Pad</span>
        </button>

        <button
          type="button"
          onClick={onOpenTechModal}
          title="Architecture, Physics & Collision Notes"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Specs</span>
        </button>
      </div>
    </div>
  );
};
