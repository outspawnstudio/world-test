export type CameraPresetId = 'chase' | 'wide' | 'aerial' | 'hood';

export type TimeOfDay = 'day' | 'night';

export type SpeedUnit = 'kmh' | 'mph';

export interface CameraPresetConfig {
  id: CameraPresetId;
  label: string;
  baseRange: number;
  maxSpeedRangeBonus: number;
  baseTilt: number;
  altitudeOffset: number;
  baseFov: number;
  maxFovBonus: number;
  hideVehicleModel?: boolean;
}

export interface VehiclePose {
  lat: number;
  lng: number;
  groundAltitude: number;
  heading: number;
  speedMs: number;
  steeringAngle: number;
  rollAngle: number;
  throttle: number;
  braking: boolean;
  boosting: boolean;
}

export interface TelemetrySnapshot {
  lat: number;
  lng: number;
  groundAltitude: number;
  heading: number;
  speedKmh: number;
  speedMph: number;
  gear: string;
  rpmRatio: number;
  braking: boolean;
  boosting: boolean;
  steeringAngle: number;
  isMoving: boolean;
}

export interface ActiveLocationInfo {
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
}

export interface LandmarkPreset {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  heading: number;
  subtitle: string;
}

export interface TouchInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  brake: boolean;
}
