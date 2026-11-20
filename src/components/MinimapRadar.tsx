import React from 'react';
import {ColorScheme, Map as GoogleMap} from '@vis.gl/react-google-maps';
import type {ActiveLocationInfo, TelemetrySnapshot, TimeOfDay} from '../types/drive';
import {compassCardinal, formatCoordinate} from '../utils/geoMath';

interface MinimapRadarProps {
  telemetry: TelemetrySnapshot;
  timeOfDay: TimeOfDay;
  locationInfo: ActiveLocationInfo;
}

export const MinimapRadar: React.FC<MinimapRadarProps> = ({
  telemetry,
  timeOfDay,
  locationInfo,
}) => {
  // Position the "N" north marker around the radar perimeter opposite the vehicle's heading
  const northRad = ((-telemetry.heading - 90) * Math.PI) / 180;
  const rx = 50 + Math.cos(northRad) * 44;
  const ry = 50 + Math.sin(northRad) * 44;

  return (
    <aside
      aria-label="Synchronized navigation minimap"
      className={`w-[240px] sm:w-[272px] rounded-xl overflow-hidden border backdrop-blur-md shadow-2xl transition-colors ${
        timeOfDay === 'night'
          ? 'bg-zinc-950/85 border-white/15 text-zinc-100'
          : 'bg-zinc-900/85 border-white/20 text-zinc-100'
      }`}
    >
      {/* Radar header readout */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-zinc-100 truncate">
            {locationInfo.name}
          </div>
          <div className="font-mono-tech text-[11px] text-zinc-400 truncate">
            {formatCoordinate(telemetry.lat, 'lat')} ·{' '}
            {formatCoordinate(telemetry.lng, 'lng')}
          </div>
        </div>
        <span className="font-display text-xs font-bold text-amber-400 shrink-0 tabular-nums">
          {compassCardinal(telemetry.heading)}
        </span>
      </div>

      {/* Interactive 2D Vector Minimap */}
      <div className="relative w-full h-[144px] sm:h-[156px] bg-zinc-950">
        <GoogleMap
          id="world-drive-minimap"
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          colorScheme={
            timeOfDay === 'night' ? ColorScheme.DARK : ColorScheme.LIGHT
          }
          center={{lat: telemetry.lat, lng: telemetry.lng}}
          heading={telemetry.heading}
          zoom={16.5}
          tilt={0}
          disableDefaultUI={true}
          gestureHandling="none"
          clickableIcons={false}
          style={{width: '100%', height: '100%'}}
        />

        {/* Subtle radar frame vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 24px rgba(0, 0, 0, 0.45)',
          }}
        />

        {/* Rotating North indicator pinned to radar edge */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded bg-zinc-950/90 border border-white/25 flex items-center justify-center font-display text-[10px] font-bold text-amber-400 shadow"
          style={{left: `${rx}%`, top: `${ry}%`}}
          aria-hidden="true"
        >
          N
        </div>

        {/* Fixed center directional player chevron + FOV cone */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="relative flex items-center justify-center">
            <div
              className="absolute -top-6 w-10 h-10 opacity-35"
              style={{
                background:
                  'conic-gradient(from 330deg at 50% 90%, transparent 0deg, #38bdf8 30deg, transparent 60deg)',
              }}
            />
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
            >
              <path
                d="M12 2.5L20 20.5L12 16.5L4 20.5L12 2.5Z"
                fill="#F59E0B"
                stroke="#09090B"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
};
