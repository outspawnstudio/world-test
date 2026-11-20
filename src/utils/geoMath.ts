const EARTH_RADIUS_METERS = 6378137;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function normalizeHeading(deg: number): number {
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

export function shortestAngleDiff(fromDeg: number, toDeg: number): number {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

/**
 * Advances a lat/lng position along a compass bearing by `distanceMeters`.
 * headingDeg = 0 is North, 90 is East, 180 is South, 270 is West.
 */
export function moveLatLng(
  lat: number,
  lng: number,
  headingDeg: number,
  distanceMeters: number
): {lat: number; lng: number} {
  if (Math.abs(distanceMeters) < 1e-6) {
    return {lat, lng};
  }

  const latRad = lat * DEG_TO_RAD;
  const lngRad = lng * DEG_TO_RAD;
  const bearingRad = headingDeg * DEG_TO_RAD;
  const angularDist = distanceMeters / EARTH_RADIUS_METERS;

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinAng = Math.sin(angularDist);
  const cosAng = Math.cos(angularDist);

  const nextLatRad = Math.asin(
    sinLat * cosAng + cosLat * sinAng * Math.cos(bearingRad)
  );
  const nextLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * sinAng * cosLat,
      cosAng - sinLat * Math.sin(nextLatRad)
    );

  return {
    lat: nextLatRad * RAD_TO_DEG,
    lng: ((nextLngRad * RAD_TO_DEG + 540) % 360) - 180,
  };
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function compassCardinal(headingDeg: number): string {
  const normalized = normalizeHeading(headingDeg);
  const index = Math.round(normalized / 45) % 8;
  return COMPASS_POINTS[index];
}

export function formatCoordinate(value: number, axis: 'lat' | 'lng'): string {
  const hemi =
    axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${Math.abs(value).toFixed(4)}° ${hemi}`;
}

export function computeGearLabel(speedMs: number, braking: boolean): {
  gear: string;
  rpmRatio: number;
} {
  const absKmh = Math.abs(speedMs) * 3.6;
  if (speedMs < -0.5) {
    return {gear: 'R', rpmRatio: Math.min(1, 0.25 + absKmh / 65)};
  }
  if (absKmh < 1.2) {
    return {gear: braking ? 'P' : 'N', rpmRatio: 0.12};
  }
  if (absKmh < 32) {
    return {gear: '1', rpmRatio: Math.min(0.95, 0.22 + (absKmh / 32) * 0.72)};
  }
  if (absKmh < 64) {
    return {gear: '2', rpmRatio: Math.min(0.95, 0.35 + ((absKmh - 32) / 32) * 0.6)};
  }
  if (absKmh < 102) {
    return {gear: '3', rpmRatio: Math.min(0.95, 0.38 + ((absKmh - 64) / 38) * 0.56)};
  }
  if (absKmh < 145) {
    return {gear: '4', rpmRatio: Math.min(0.95, 0.42 + ((absKmh - 102) / 43) * 0.52)};
  }
  if (absKmh < 195) {
    return {gear: '5', rpmRatio: Math.min(0.96, 0.45 + ((absKmh - 145) / 50) * 0.5)};
  }
  return {gear: '6', rpmRatio: Math.min(1, 0.52 + ((absKmh - 195) / 80) * 0.48)};
}
