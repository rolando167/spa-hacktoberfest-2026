import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, nowLabel } from '../components/Header';
import { MapView } from '../components/MapView';
import { ArrowRightIcon } from '../components/icons';
import { useGeolocation } from '../hooks/useGeolocation';
import { FALLBACK_POSITION } from '../lib/geo';
import { useAppState } from '../state/AppState';

export function Home() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { setIntent, setRoute } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const position = geo.position ?? FALLBACK_POSITION;
  const canSearch = geo.position !== null;

  function searchNearby() {
    if (!geo.position) {
      setError('Aún necesito tu ubicación para buscar lugares cerca.');
      return;
    }

    setError(null);
    setRoute(null);
    // El backend todavía no necesita preferencias del usuario: este estado permite
    // reutilizar la pantalla de resultados mientras la búsqueda usa solo el pin.
    setIntent({
      transcript: 'Buscar lugares con historia cerca de mi ubicación.',
      intent: {
        tags: ['Cerca de ti', 'Historia local'],
        maxMinutes: null,
        indoor: false,
        categories: ['historic'],
        summary: 'Lugares con historia cerca de tu ubicación.',
      },
    });
    navigate('/ruta');
  }

  return (
    <main className="screen">
      <Header kicker={nowLabel()} title="¿Qué hay cerca?" />

      <MapView
        className="map--short"
        position={position}
        accuracy={geo.accuracy}
        heading={geo.heading}
        follow
        reachMeters={400}
        zoom={16}
      />
      <p className="map-caption">
        <span className="dot dot--user" />
        {geo.position
          ? `Estás aquí · precisión ${Math.round(geo.accuracy ?? 0)} m`
          : geo.error ?? 'Buscando tu ubicación…'}
      </p>

      <section className="card stack-xs">
        <span className="eyebrow">Explora a pie</span>
        <p className="body">Buscaremos rincones, placas y huellas de historia a menos de 400 metros.</p>
      </section>

      <div className="grow" />

      {error && <p className="error center small">{error}</p>}
      <button type="button" className="btn btn--primary btn--big" onClick={searchNearby} disabled={!canSearch}>
        Buscar lugares cerca <ArrowRightIcon />
      </button>
      {!canSearch && <p className="muted center small">Esperando tu ubicación…</p>}
    </main>
  );
}
