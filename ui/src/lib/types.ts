// Contrato compartido entre la SPA y el Worker (/worker/src/types.ts es una copia).

export type LatLng = { lat: number; lng: number };

/** Lo que el LLM 1 extrae de lo que dice el usuario. */
export type Intent = {
  /** Etiquetas para mostrar como chips, en español y cortas. Ej.: "Llueve", "Bajo techo". */
  tags: string[];
  /** Tiempo máximo andando, en minutos. null si no lo ha dicho. */
  maxMinutes: number | null;
  indoor: boolean;
  /** Tipos de sitio que encajan, en vocabulario propio (ver CATEGORIES en el Worker). */
  categories: string[];
  /** Resumen en una frase de lo que busca. */
  summary: string;
};

export type IntentResponse = {
  transcript: string;
  intent: Intent;
};

export type Poi = {
  id: string;
  name: string;
  position: LatLng;
  /** Resumen corto para la lista (≤ 120 caracteres). */
  short: string;
  /** Descripción detallada para el panel de llegada. */
  detail: string;
  suggestedMinutes: number;
  photoUrl: string | null;
  /** Minutos andando desde el punto anterior. */
  walkMinutesFromPrev: number;
  indoor: boolean;
};

export type RouteSuggestion = {
  id: string;
  title: string;
  summary: string;
  distanceMeters: number;
  durationMinutes: number;
  /** Trazado a pie, [lat, lng] en orden. */
  path: [number, number][];
  stops: Poi[];
  tags: string[];
};

export type RouteRequest = {
  origin: LatLng;
  intent: Intent;
};

export type PointOfInterestCandidate = {
  id: string;
  source: 'wikipedia' | 'osm';
  name: string;
  coordinates: { lat: number; lon: number };
  distanceM: number;
  sourceUrl: string;
  evidence: string;
  tags: Record<string, string>;
};

export type NearbySuggestion = {
  candidateId: string;
  title: string;
  whyInteresting: string;
  historicalTheme: string;
};

export type NearbyResearchResponse = {
  location: { lat: number; lon: number; radiusM: number };
  rawCandidates: PointOfInterestCandidate[];
  suggestions: NearbySuggestion[];
};
