import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Zap,
} from 'lucide-react';
import type {TouchInputState} from '../types/drive';

interface TouchDrivePadProps {
  visible: boolean;
  onControlChange: (control: keyof TouchInputState, active: boolean) => void;
}

export const TouchDrivePad: React.FC<TouchDrivePadProps> = ({
  visible,
  onControlChange,
}) => {
  if (!visible) return null;

  const bindHold = (control: keyof TouchInputState) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      onControlChange(control, true);
    },
    onPointerUp: () => onControlChange(control, false),
    onPointerCancel: () => onControlChange(control, false),
    onPointerLeave: () => onControlChange(control, false),
  });

  return (
    <div
      aria-label="On-screen driving controls"
      className="flex items-end gap-3 pointer-events-auto select-none"
    >
      {/* Left / Right Steering */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-white/15 bg-zinc-950/85 backdrop-blur-md shadow-xl">
        <button
          type="button"
          aria-label="Steer left"
          {...bindHold('left')}
          className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/15 active:bg-amber-400 active:text-zinc-950 text-zinc-100 flex items-center justify-center transition-colors cursor-pointer touch-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Steer right"
          {...bindHold('right')}
          className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/15 active:bg-amber-400 active:text-zinc-950 text-zinc-100 flex items-center justify-center transition-colors cursor-pointer touch-none"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Brake / Boost / Gas / Reverse */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-white/15 bg-zinc-950/85 backdrop-blur-md shadow-xl">
        <button
          type="button"
          aria-label="Reverse or brake"
          {...bindHold('backward')}
          className="w-11 h-11 rounded-lg bg-white/5 hover:bg-red-500/20 active:bg-red-500 active:text-white text-zinc-100 flex items-center justify-center transition-colors cursor-pointer touch-none"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Boost"
          {...bindHold('boost')}
          className="w-11 h-11 rounded-lg bg-white/5 hover:bg-sky-500/20 active:bg-sky-400 active:text-zinc-950 text-sky-300 flex items-center justify-center transition-colors cursor-pointer touch-none"
        >
          <Zap className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Accelerate forward"
          {...bindHold('forward')}
          className="w-12 h-11 rounded-lg bg-amber-400/20 border border-amber-400/40 hover:bg-amber-400/35 active:bg-amber-400 active:text-zinc-950 text-amber-300 flex items-center justify-center transition-colors cursor-pointer touch-none"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
