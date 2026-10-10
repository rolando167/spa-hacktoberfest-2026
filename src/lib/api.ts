import { mockIntent, mockRoute } from './mocks';
import type { IntentResponse, LatLng, RouteRequest, RouteSuggestion } from './types';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Sube el audio grabado. El Worker lo transcribe y extrae la intención. */
export async function detectIntent(audio: Blob, position?: LatLng | null): Promise<IntentResponse> {
  if (USE_MOCKS) return mockIntent();
  const form = new FormData();
  form.append('audio', audio, 'voz.' + (audio.type.includes('mp4') ? 'mp4' : 'webm'));
  // Con la ubicación, el Worker consulta el tiempo actual (si llueve, prioriza sitios cubiertos)
  if (position) {
    form.append('lat', String(position.lat));
    form.append('lng', String(position.lng));
  }
  return asJson(await fetch(`${BASE}/api/intent`, { method: 'POST', body: form }));
}

export async function suggestRoute(req: RouteRequest): Promise<RouteSuggestion> {
  if (USE_MOCKS) return mockRoute(req.origin);
  return asJson(
    await fetch(`${BASE}/api/route`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    }),
  );
}
