// Búsqueda de información para la ruta: tiempo, POIs reales, trazado a pie y fotos.
// El LLM NUNCA inventa sitios: elige entre los candidatos reales que devuelve findCandidates().
import type { LatLng } from '../../src/lib/types';

const UA = 'rutas-voz/0.1 (+https://github.com/)'; // TODO: URL de tu repo o tu web (Overpass y Wikidata la piden)

// ---------- Tiempo (Open-Meteo, sin clave) ----------
export async function currentWeather(p: LatLng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&current=temperature_2m,precipitation,weather_code,is_day&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = (await res.json()) as {
      current: { temperature_2m: number; precipitation: number; weather_code: number; is_day: number };
    };
    return {
      temperatureC: d.current.temperature_2m,
      precipitationMm: d.current.precipitation,
      raining: d.current.precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(d.current.weather_code),
      isDay: d.current.is_day === 1,
    };
  } catch {
    return null;
  }
}

// ---------- POIs (Overpass / OpenStreetMap) ----------
/** Vocabulario de categorías que entiende el LLM → filtros de OSM. */
export const CATEGORIES: Record<string, { filters: string[]; indoor: boolean }> = {
  market: { filters: ['["amenity"="marketplace"]', '["shop"="mall"]'], indoor: true },
  cafe: { filters: ['["amenity"="cafe"]'], indoor: true },
  restaurant: { filters: ['["amenity"="restaurant"]'], indoor: true },
  bar: { filters: ['["amenity"="bar"]', '["amenity"="pub"]'], indoor: true },
  museum: { filters: ['["tourism"="museum"]'], indoor: true },
  gallery: { filters: ['["tourism"="gallery"]'], indoor: true },
  library: { filters: ['["amenity"="library"]'], indoor: true },
  bookshop: { filters: ['["shop"="books"]'], indoor: true },
  cinema: { filters: ['["amenity"="cinema"]', '["amenity"="theatre"]'], indoor: true },
  church: { filters: ['["amenity"="place_of_worship"]["historic"]'], indoor: true },
  park: { filters: ['["leisure"="park"]', '["leisure"="garden"]'], indoor: false },
  viewpoint: { filters: ['["tourism"="viewpoint"]'], indoor: false },
  monument: { filters: ['["historic"="monument"]', '["historic"="memorial"]', '["tourism"="attraction"]'], indoor: false },
};

export type Candidate = {
  id: string;
  name: string;
  category: string;
  position: LatLng;
  indoor: boolean;
  wikidata?: string;
  tags: Record<string, string>;
};

export async function findCandidates(origin: LatLng, radius: number, categories: string[]): Promise<Candidate[]> {
  const cats = categories.filter((c) => c in CATEGORIES);
  const use = cats.length ? cats : ['cafe', 'museum', 'park', 'monument'];
  const parts = use.flatMap((c) =>
    CATEGORIES[c].filters.map((f) => `nwr${f}["name"](around:${Math.round(radius)},${origin.lat},${origin.lng});`),
  );
  const query = `[out:json][timeout:20];(${parts.join('')});out center tags 80;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = (await res.json()) as {
    elements: {
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }[];
  };

  const seen = new Set<string>();
  return data.elements
    .map((e): Candidate | null => {
      const lat = e.lat ?? e.center?.lat;
      const lng = e.lon ?? e.center?.lon;
      const tags = e.tags ?? {};
      if (lat == null || lng == null || !tags.name) return null;
      const category = use.find((c) => CATEGORIES[c].filters.some((f) => matches(tags, f))) ?? use[0];
      return {
        id: `${e.type}/${e.id}`,
        name: tags.name,
        category,
        position: { lat, lng },
        indoor: CATEGORIES[category].indoor,
        wikidata: tags.wikidata,
        tags: pick(tags, ['amenity', 'tourism', 'historic', 'shop', 'leisure', 'cuisine', 'opening_hours', 'description', 'start_date', 'architect', 'heritage']),
      };
    })
    .filter((c): c is Candidate => !!c && !seen.has(c.name) && !!seen.add(c.name));
}

function matches(tags: Record<string, string>, filter: string) {
  return [...filter.matchAll(/\["([^"]+)"(?:="([^"]+)")?\]/g)].every(([, k, v]) => (v ? tags[k] === v : k in tags));
}

function pick(o: Record<string, string>, keys: string[]) {
  return Object.fromEntries(keys.filter((k) => o[k]).map((k) => [k, o[k]]));
}

// ---------- Trazado a pie (OpenRouteService) ----------
export type Directions = {
  path: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  legs: { distance: number; duration: number }[];
};

export async function walkingDirections(apiKey: string | undefined, points: LatLng[]): Promise<Directions> {
  if (!apiKey) return straightLine(points);
  const res = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ coordinates: points.map((p) => [p.lng, p.lat]) }),
  });
  if (!res.ok) return straightLine(points);
  const d = (await res.json()) as {
    features: {
      geometry: { coordinates: [number, number][] };
      properties: { summary: { distance: number; duration: number }; segments: { distance: number; duration: number }[] };
    }[];
  };
  const f = d.features[0];
  return {
    path: f.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceMeters: f.properties.summary.distance,
    durationSeconds: f.properties.summary.duration,
    legs: f.properties.segments.map((s) => ({ distance: s.distance, duration: s.duration })),
  };
}

/** Plan B sin clave de ORS: líneas rectas a 4,8 km/h con un 25 % extra por las calles. */
function straightLine(points: LatLng[]): Directions {
  const legs = points.slice(1).map((p, i) => {
    const distance = haversine(points[i], p) * 1.25;
    return { distance, duration: distance / 1.33 };
  });
  return {
    path: points.map((p) => [p.lat, p.lng]),
    distanceMeters: legs.reduce((a, l) => a + l.distance, 0),
    durationSeconds: legs.reduce((a, l) => a + l.duration, 0),
    legs,
  };
}

export function haversine(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- Fotos (Wikidata P18 → Wikimedia Commons) ----------
export async function photoFor(wikidataId?: string): Promise<string | null> {
  if (!wikidataId || !/^Q\d+$/.test(wikidataId)) return null;
  try {
    const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`, {
      headers: { 'user-agent': UA },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      entities: Record<string, { claims?: { P18?: { mainsnak: { datavalue?: { value: string } } }[] } }>;
    };
    const file = d.entities[wikidataId]?.claims?.P18?.[0]?.mainsnak.datavalue?.value;
    return file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=480` : null;
  } catch {
    return null;
  }
}
