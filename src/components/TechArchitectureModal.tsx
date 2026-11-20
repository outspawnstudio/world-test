import React from 'react';
import {X} from 'lucide-react';

interface TechArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechArchitectureModal: React.FC<TechArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tech-specs-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 text-zinc-100 shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2
              id="tech-specs-title"
              className="font-display text-xl font-bold tracking-wide text-white"
            >
              WORLD<span className="text-amber-400">//</span>DRIVE Architecture &
              Simulation Scope
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Surface-following 3D world explorer · Visual 3D Tiles without
              mesh collision
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close specifications"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/5 p-4 space-y-1.5">
            <h3 className="font-semibold text-amber-300 text-xs uppercase tracking-wider">
              Prototype Honesty Notice
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Google Maps Photorealistic 3D Tiles provide visual photogrammetry
              meshes streamed inside Google&apos;s black-box WebGL renderer. They
              do not expose raw triangle buffers for client-side collision
              queries. Therefore, WORLD//DRIVE uses terrain-following geodesic
              kinematics with ElevationService sampling and does not fake
              building collisions or rigid-body physics. Day/Night mode applies
              real-time atmospheric grading and switches the vector minimap to
              dark styling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <h3 className="font-display text-sm font-bold text-white">
                1. Real Car Physics
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Replace geodesic velocity integration with a fixed-timestep
                (60–120 Hz) rigid-body engine (e.g., Rapier WASM or PhysX)
                featuring spring-damper suspension raycasts, Ackermann steering,
                weight transfer, and Pacejka tire friction curves.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <h3 className="font-display text-sm font-bold text-white">
                2. Collision World
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pair the visual 3D map (or a Three.js + Map Tiles API OGC 3D
                Tiles renderer) with a spatial collision layer: extruded
                building footprint polygons / vector road surfaces and
                server-side BVH/heightfield colliders.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <h3 className="font-display text-sm font-bold text-white">
                3. Multiplayer
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Add an authoritative WebSocket / WebRTC server running regional
                spatial cells (geohash/quadtree interest management), client-side
                input prediction with reconciliation, and Hermite snapshot
                interpolation for smooth remote vehicles.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Controls: WASD / Arrow Keys · Shift Boost · Space Brake · C Camera
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-400 text-zinc-950 font-semibold hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Resume Driving
          </button>
        </div>
      </div>
    </div>
  );
};
