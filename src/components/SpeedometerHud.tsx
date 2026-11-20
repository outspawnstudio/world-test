import React from 'react';
import type {SpeedUnit, TelemetrySnapshot} from '../types/drive';
import {compassCardinal} from '../utils/geoMath';

interface SpeedometerHudProps {
  telemetry: TelemetrySnapshot;
  speedUnit: SpeedUnit;
  onToggleUnit: () => void;
}

export const SpeedometerHud: React.FC<SpeedometerHudProps> = ({
  telemetry,
  speedUnit,
  onToggleUnit,
}) => {
  const displaySpeed =
    speedUnit === 'kmh' ? telemetry.speedKmh : telemetry.speedMph;
  const maxGaugeSpeed = speedUnit === 'kmh' ? 250 : 155;
  const speedRatio = Math.min(1, displaySpeed / maxGaugeSpeed);

  // SVG semi-circular arc math (240 degree sweep)
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 240 / 360;
  const totalArc = circumference * arcFraction;
  const activeArc = totalArc * speedRatio;

  const arcColor = telemetry.boosting
    ? '#38BDF8'
    : speedRatio > 0.78
      ? '#EF4444'
      : '#F59E0B';

  return (
    <section
      aria-label="Speedometer and vehicle telemetry"
      className="w-[240px] sm:w-[264px] rounded-xl border border-white/15 bg-zinc-950/85 backdrop-blur-md p-3.5 text-zinc-100 shadow-2xl"
    >
      <div className="flex items-center gap-3">
        {/* Radial Speedometer Gauge */}
        <div className="relative w-[122px] h-[106px] shrink-0 flex items-center justify-center">
          <svg
            width="122"
            height="106"
            viewBox="0 0 128 112"
            className="overflow-visible"
            aria-hidden="true"
          >
            {/* Background track arc */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${totalArc} ${circumference}`}
              transform="rotate(150 64 64)"
            />
            {/* Active speed arc */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={arcColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${activeArc} ${circumference}`}
              transform="rotate(150 64 64)"
              style={{transition: 'stroke 150ms ease-out'}}
            />
          </svg>

          {/* Center numeric speed readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
            <span className="font-display text-3xl font-bold tracking-tight text-white tabular-nums leading-none">
              {displaySpeed}
            </span>
            <button
              type="button"
              onClick={onToggleUnit}
              title="Toggle KM/H or MPH"
              className="mt-1 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-300 hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              {speedUnit === 'kmh' ? 'KM/H' : 'MPH'}
            </button>
          </div>
        </div>

        {/* Gear, RPM & Telemetry Column */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-medium text-zinc-400">Gear</span>
            <span
              className={`font-display text-xl font-bold tabular-nums ${
                telemetry.gear === 'R'
                  ? 'text-red-400'
                  : telemetry.boosting
                    ? 'text-sky-400'
                    : 'text-amber-400'
              }`}
            >
              {telemetry.gear}
            </span>
          </div>

          {/* RPM / Drive Load Bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
              <span>Drive</span>
              <span className="font-mono-tech text-zinc-300">
                {Math.round(telemetry.rpmRatio * 8)}k
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  telemetry.braking
                    ? 'bg-red-500'
                    : telemetry.boosting
                      ? 'bg-sky-400'
                      : 'bg-amber-400'
                }`}
                style={{width: `${Math.round(telemetry.rpmRatio * 100)}%`}}
              />
            </div>
          </div>

          {/* Bearing & Altitude */}
          <div className="pt-1 border-t border-white/10 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Heading</span>
              <span className="font-mono-tech text-zinc-200">
                {telemetry.heading}° {compassCardinal(telemetry.heading)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Elevation</span>
              <span className="font-mono-tech text-zinc-200">
                {telemetry.groundAltitude} m
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit state flags + unobtrusive keybind strip */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="truncate">WASD / Arrows · Shift Boost · Space Brake</span>
        {telemetry.braking ? (
          <span className="font-semibold text-red-400 shrink-0">BRAKE</span>
        ) : telemetry.boosting ? (
          <span className="font-semibold text-sky-400 shrink-0">BOOST</span>
        ) : null}
      </div>
    </section>
  );
};
