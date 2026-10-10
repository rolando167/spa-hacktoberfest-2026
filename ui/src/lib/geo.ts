import type { LatLng } from './types';

const R = 6371000; // radio terrestre en metros

/** Distancia en metros entre dos puntos (fórmula de haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Desplaza un punto `meters` metros con rumbo `bearingDeg` (0 = norte). */
export function offset(p: LatLng, meters: number, bearingDeg: number): LatLng {
  const b = (bearingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(b)) / R;
  const dLng = (meters * Math.sin(b)) / (R * Math.cos((p.lat * Math.PI) / 180));
  return { lat: p.lat + (dLat * 180) / Math.PI, lng: p.lng + (dLng * 180) / Math.PI };
}

/** Minutos a pie a 4,8 km/h. */
export const walkMinutes = (meters: number) => Math.max(1, Math.round(meters / 80));

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Ubicación por defecto si el usuario no da permiso: Puerta del Sol, Madrid. */
export const FALLBACK_POSITION: LatLng = { lat: 40.4169, lng: -3.7035 };
