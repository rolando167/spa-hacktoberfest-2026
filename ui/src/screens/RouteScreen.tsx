import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { IntentChips } from '../components/IntentChips';
import { MapView } from '../components/MapView';
import { PoiCard } from '../components/PoiCard';
import { ArrowLeftIcon, NavIcon } from '../components/icons';
import { useGeolocation } from '../hooks/useGeolocation';
import { suggestRoute } from '../lib/api';
import { FALLBACK_POSITION, formatDistance } from '../lib/geo';
import { useAppState } from '../state/AppState';

export function RouteScreen() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { intent, route, setRoute } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Pide la ruta cuando ya hay ubicación (o se ha descartado) y no hay ruta guardada
  const origin = geo.position ?? (geo.error ? FALLBACK_POSITION : null);
  useEffect(() => {
    if (!intent || !origin || (route && attempt === 0)) return;
    let alive = true;
    setLoading(true);
    setError(null);
    suggestRoute({ origin, intent: intent.intent })
      .then((r) => alive && setRoute(r))
      .catch((e: Error) => alive && setError(e.message || 'No se pudo generar la ruta.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // origin se omite a propósito: no regeneramos la ruta cada vez que se mueve el GPS
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, attempt, !!origin]);

  if (!intent) return <Navigate to="/inicio" replace />;

  const back = (
    <button type="button" className="icon-btn" aria-label="Volver" onClick={() => navigate('/inicio')}>
      <ArrowLeftIcon />
    </button>
  );

  return (
    <main className="screen screen--scroll">
      <Header left={back} title={<span className="header__center">Ruta sugerida</span>} />

      {loading || !route ? (
        <div className="loading">
          {error ? (
            <>
              <p className="error">{error}</p>
              <button type="button" className="btn btn--primary" onClick={() => setAttempt((a) => a + 1)}>
                Reintentar
              </button>
            </>
          ) : (
            <>
              <div className="spinner" aria-hidden="true" />
              <p className="muted">Buscando sitios reales cerca y trazando la ruta…</p>
            </>
          )}
        </div>
      ) : (
        <>
          <MapView className="map--tall" position={origin ?? FALLBACK_POSITION} route={route} fitRoute showControls />

          <section className="stack">
            <h1 className="display">{route.title}</h1>
            <div className="stats">
              <div className="stat">
                <strong>{route.durationMinutes} min</strong>
                <span>a pie</span>
              </div>
              <div className="stat">
                <strong>{formatDistance(route.distanceMeters)}</strong>
                <span>distancia</span>
              </div>
              <div className="stat">
                <strong>{route.stops.length}</strong>
                <span>{route.stops.every((s) => s.indoor) ? 'paradas cubiertas' : 'paradas'}</span>
              </div>
            </div>
            <p className="body">{route.summary}</p>
            <IntentChips tags={route.tags} small />
          </section>

          <h2 className="eyebrow section-title">Puntos de interés</h2>
          <div className="stack-sm">
            {route.stops.map((s, i) => (
              <PoiCard key={s.id} poi={s} index={i} />
            ))}
          </div>

          <div className="row actions">
            <button type="button" className="btn btn--outline" onClick={() => setAttempt((a) => a + 1)}>
              Otra ruta
            </button>
            <button type="button" className="btn btn--primary btn--wide" onClick={() => navigate('/navegar')}>
              Empezar ruta <NavIcon size={18} />
            </button>
          </div>
        </>
      )}
    </main>
  );
}
