// Datos simulados para desarrollar sin backend (VITE_USE_MOCKS=true).
// La ruta se genera alrededor de la ubicación real del usuario, así funciona en cualquier ciudad.
import { distanceMeters, offset, walkMinutes } from './geo';
import type { IntentResponse, LatLng, RouteSuggestion, SelectedPlaceResponse } from './types';

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
    title: 'Descubrimientos cerca de ti',
    summary: 'Lugares de ejemplo para probar la selección y la investigación detallada.',
    distanceMeters: total,
    durationMinutes: walkMinutes(total),
    path: pts.map((p) => [p.lat, p.lng]),
    tags: ['Llueve', 'Bajo techo', '≤ 15 min'],
    stops: [
      {
        id: 's1',
        name: 'Una calle con memoria',
        position: p1,
        short: 'Una esquina discreta conserva pistas de cómo era el barrio.',
        detail: 'Descripción histórica simulada para probar la experiencia.',
        suggestedMinutes: 15,
        photoUrl: null,
        walkMinutesFromPrev: walkMinutes(legs[0]),
        indoor: true,
        historicalTheme: 'Memoria del barrio',
        distanceMeters: legs[0],
      },
      {
        id: 's2',
        name: 'Azulejos del portal',
        position: p2,
        short: 'Un detalle cerámico cuenta algo sobre quienes vivieron aquí.',
        detail: 'Descripción histórica simulada para probar la experiencia.',
        suggestedMinutes: 20,
        photoUrl: null,
        walkMinutesFromPrev: walkMinutes(legs[1]),
        indoor: true,
        historicalTheme: 'Arquitectura cotidiana',
        distanceMeters: distanceMeters(origin, p2),
      },
      {
        id: 's3',
        name: 'Marcas de otras épocas',
        position: p3,
        short: 'Huellas visibles en una fachada revelan capas de historia.',
        detail: 'Descripción histórica simulada para probar la experiencia.',
        suggestedMinutes: 15,
        photoUrl: null,
        walkMinutesFromPrev: walkMinutes(legs[2]),
        indoor: true,
        historicalTheme: 'Historia urbana',
        distanceMeters: distanceMeters(origin, p3),
      },
    ],
  };
}

export async function mockSelectedPlace(candidateId: string): Promise<SelectedPlaceResponse> {
  await wait(1200);
  const names: Record<string, string> = {
    s1: 'Una calle con memoria',
    s2: 'Azulejos del portal',
    s3: 'Marcas de otras épocas',
  };
  const name = names[candidateId] ?? 'Rincón de Madrid';
  const audioScript = `${name}. Fíjate en los detalles que cuentan la historia cotidiana de este lugar. Los mercados y espacios de barrio reúnen pequeñas huellas de cómo ha cambiado Madrid y de las personas que lo han habitado. Mira alrededor: los materiales, las inscripciones y la forma del edificio pueden ofrecer pistas sobre distintas épocas. Esta guía de prueba usa contenido de ejemplo; con el servicio conectado, la investigación se apoya en fuentes verificables del lugar.`;
  return {
    candidateId,
    place: { name, source: 'osm', sourceUrls: ['https://www.openstreetmap.org/'] },
    guide: {
      title: `La historia de ${name}`,
      researchSummary: 'Resumen de investigación simulado. Al conectar el backend se mostrarán aquí los detalles verificados del lugar seleccionado.',
      audioScript,
    },
    audio: {
      mimeType: 'audio/mpeg',
      base64: '',
    },
  };
}
