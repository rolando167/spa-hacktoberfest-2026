import { useEffect, useState } from 'react';
import type { LatLng } from '../lib/types';

export type GeoState = {
  position: LatLng | null;
  /** Precisión en metros. */
  accuracy: number | null;
  /** Rumbo en grados (0 = norte). null si estás parado o el dispositivo no lo da. */
  heading: number | null;
  error: string | null;
};

/**
 * Sigue la ubicación con watchPosition mientras el componente está montado.
 * Ojo: en web solo funciona con la pantalla encendida y la pestaña visible, y exige HTTPS.
 */
export function useGeolocation(enabled = true): GeoState {
  const [state, setState] = useState<GeoState>({ position: null, accuracy: null, heading: null, error: null });

  useEffect(() => {
    if (!enabled) return;
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'Tu navegador no permite geolocalización.' }));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          heading: Number.isFinite(pos.coords.heading) ? pos.coords.heading : null,
          error: null,
        }),
      (err) =>
        setState((s) => ({
          ...s,
          error: err.code === err.PERMISSION_DENIED ? 'Sin permiso de ubicación.' : 'No se pudo obtener la ubicación.',
        })),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return state;
}
