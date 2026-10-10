import { mockIntent, mockRoute, mockSelectedPlace } from './mocks';
import { distanceMeters, walkMinutes } from './geo';
import type {
  IntentResponse,
  LatLng,
  NearbyResearchResponse,
  RouteRequest,
  RouteSuggestion,
  SelectedPlaceResponse,
} from './types';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
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
  const nearby = await asJson<NearbyResearchResponse>(
    await fetch(`${BASE}/api/research-nearby`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lat: req.origin.lat, lon: req.origin.lng, radiusM: 400 }),
    }),
  );
  return nearbyToRoute(req.origin, nearby);
}

function nearbyToRoute(origin: LatLng, nearby: NearbyResearchResponse): RouteSuggestion {
  const candidates = new Map(nearby.rawCandidates.map((candidate) => [candidate.id, candidate]));
  const discoveredStops = nearby.suggestions.flatMap((suggestion) => {
    const candidate = candidates.get(suggestion.candidateId);
    if (!candidate) return [];
    const position = { lat: candidate.coordinates.lat, lng: candidate.coordinates.lon };

    return [{
      id: candidate.id,
      name: suggestion.title || candidate.name,
      position,
      short: suggestion.whyInteresting,
      detail: suggestion.whyInteresting,
      suggestedMinutes: 10,
      photoUrl: null,
      walkMinutesFromPrev: 0,
      indoor: false,
      historicalTheme: suggestion.historicalTheme,
      distanceMeters: candidate.distanceM,
    }];
  });

  if (discoveredStops.length === 0) {
    throw new Error('No he encontrado lugares interesantes cerca de esta ubicación.');
  }

  const stops = discoveredStops.map((stop, index) => {
    const previous = index === 0 ? origin : discoveredStops[index - 1].position;
    return { ...stop, walkMinutesFromPrev: walkMinutes(distanceMeters(previous, stop.position)) };
  });

  const path: [number, number][] = [
    [origin.lat, origin.lng],
    ...stops.map((stop) => [stop.position.lat, stop.position.lng] as [number, number]),
  ];
  const distanceMetersTotal = path.slice(1).reduce(
    (total, point, index) => total + distanceMeters({ lat: path[index][0], lng: path[index][1] }, { lat: point[0], lng: point[1] }),
    0,
  );

  return {
    id: `nearby-${nearby.location.lat}-${nearby.location.lon}`,
    title: 'Descubrimientos cerca de ti',
    summary: 'Una selección de lugares con historia a pocos minutos de donde estás.',
    distanceMeters: distanceMetersTotal,
    durationMinutes: walkMinutes(distanceMetersTotal),
    path,
    stops,
    tags: [...new Set(nearby.suggestions.map((suggestion) => suggestion.historicalTheme))],
  };
}

export async function researchSelectedPlace(candidateId: string): Promise<SelectedPlaceResponse> {
  if (USE_MOCKS) return mockSelectedPlace(candidateId);
  return asJson(await fetch(`${BASE}/api/selected-place`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ candidateId }),
  }));
}
