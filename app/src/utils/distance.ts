type Point = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;
// ~4.8 km/h, a relaxed walk in Chiang Mai heat
const WALK_METERS_PER_MIN = 80;
// Past this, "N min walk" stops being useful; show distance instead
const MAX_WALK_MIN = 30;

export function distanceMeters(a: Point, b: Point): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** "6 min walk", or "3.4 km away" when it's too far to walk. */
export function formatWalk(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / WALK_METERS_PER_MIN));
  if (minutes <= MAX_WALK_MIN) return `${minutes} min walk`;
  return `${(meters / 1000).toFixed(1)} km away`;
}
