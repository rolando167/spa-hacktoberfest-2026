// Datos simulados para desarrollar sin backend (VITE_USE_MOCKS=true).
// La ruta se genera alrededor de la ubicación real del usuario, así funciona en cualquier ciudad.
import { distanceMeters, offset, walkMinutes } from './geo';
import type { IntentResponse, LatLng, RouteSuggestion } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockIntent(): Promise<IntentResponse> {
  await wait(900);
  return {
    transcript: 'Está lloviendo, quiero algo bajo techo y que no sea más de quince minutos',
    intent: {
      tags: ['Llueve', 'Bajo techo', '≤ 15 min a pie'],
      maxMinutes: 15,
      indoor: true,
      categories: ['market', 'cafe', 'museum'],
      summary: 'Plan corto y a cubierto porque llueve.',
    },
  };
}

export async function mockRoute(origin: LatLng): Promise<RouteSuggestion> {
  await wait(1400);
  const p1 = offset(origin, 300, 290);
  const p2 = offset(p1, 230, 350);
  const p3 = offset(p2, 380, 40);
  const pts = [origin, p1, p2, p3];
  const legs = pts.slice(1).map((p, i) => distanceMeters(pts[i], p));
  const total = legs.reduce((a, b) => a + b, 0);

  return {
    id: 'mock-1',
    title: 'Paseo a cubierto (simulado)',
    summary:
      'Ruta de ejemplo generada sin backend. Tramos cortos entre tres paradas bajo techo, para probar el flujo completo.',
    distanceMeters: total,
    durationMinutes: walkMinutes(total),
    path: pts.map((p) => [p.lat, p.lng]),
    tags: ['Llueve', 'Bajo techo', '≤ 15 min'],
    stops: [
      {
        id: 's1',
        name: 'Parada 1 · Mercado',
        position: p1,
        short: 'Mercado cubierto para picar algo sin mojarte.',
        detail:
          'Descripción detallada simulada. En producción la escribe el LLM a partir de los datos de OpenStreetMap y Wikidata del sitio.',
        suggestedMinutes: 15,
        photoUrl: null,
        walkMinutesFromPrev: walkMinutes(legs[0]),
        indoor: true,
      },
      {
        id: 's2',
        name: 'Parada 2 · Cafetería',
        position: p2,
        short: 'Algo caliente antes de seguir.',
        detail: 'Descripción detallada simulada de la segunda parada.',
        suggestedMinutes: 20,
        photoUrl: null,
        walkMinutesFromPrev: walkMinutes(legs[1]),
        indoor: true,
      },
      {
        id: 's3',
        name: 'Parada 3 · Mirador cubierto',
        position: p3,
        short: 'Vistas de la ciudad desde dentro.',
        detail: 'Descripción detallada simulada de la tercera parada.',
        suggestedMinutes: 15,
        photoUrl: null,
        walkMinutesFromPrev: walkMinutes(legs[2]),
        indoor: true,
      },
    ],
  };
}
