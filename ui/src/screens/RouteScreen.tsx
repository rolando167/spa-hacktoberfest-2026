import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { ArrowLeftIcon, ArrowRightIcon } from '../components/icons';
import { useGeolocation } from '../hooks/useGeolocation';
import { researchSelectedPlace, suggestRoute } from '../lib/api';
import { FALLBACK_POSITION, formatDistance } from '../lib/geo';
import type { SelectedPlaceResponse } from '../lib/types';
import { useAppState } from '../state/AppState';

export function RouteScreen() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { intent, route, setRoute } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  async function selectPlace(candidateId: string) {
    setSelectedId(candidateId);
    setSelectedPlace(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setSelectedPlace(await researchSelectedPlace(candidateId));
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : 'No se pudo investigar este lugar.');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <main className="screen screen--scroll">
      <Header left={back} title={<span className="header__center">Lugares cerca de ti</span>} />

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
              <p className="muted">Buscando rincones con historia cerca de ti…</p>
            </>
          )}
        </div>
      ) : (
        <>
          <section className="stack">
            <h1 className="display">Descubrimientos cerca de ti</h1>
            <p className="body">{route.summary}</p>
          </section>

          <h2 className="eyebrow section-title">Elige un lugar para descubrir su historia</h2>
          <div className="stack-sm">
            {route.stops.map((place, i) => (
              <button
                key={place.id}
                type="button"
                className="suggestion"
                aria-pressed={selectedId === place.id}
                disabled={detailLoading}
                onClick={() => selectPlace(place.id)}
              >
                <span className="suggestion__number">{String(i + 1).padStart(2, '0')}</span>
                <span className="suggestion__content">
                  <span className="suggestion__theme">{place.historicalTheme ?? 'Historia local'}</span>
                  <strong className="suggestion__title">{place.name}</strong>
                  <span className="suggestion__text">{place.short}</span>
                  {place.distanceMeters !== undefined && (
                    <span className="suggestion__distance">A {formatDistance(place.distanceMeters)}</span>
                  )}
                </span>
                <ArrowRightIcon size={18} />
              </button>
            ))}
          </div>

          {selectedId && (
            <section className="place-detail" aria-live="polite">
              {detailLoading ? (
                <div className="row">
                  <div className="spinner spinner--small" aria-hidden="true" />
                  <p className="muted">Investigando el lugar y preparando la audioguía…</p>
                </div>
              ) : detailError ? (
                <div className="stack-xs">
                  <p className="error">{detailError}</p>
                  <button type="button" className="btn btn--outline" onClick={() => selectPlace(selectedId)}>
                    Reintentar
                  </button>
                </div>
              ) : selectedPlace ? (
                <div className="stack-sm">
                  <div>
                    <span className="eyebrow">Descubrimiento ampliado</span>
                    <h2 className="display display--xs place-detail__title">{selectedPlace.guide.title}</h2>
                  </div>
                  <p className="body">{selectedPlace.guide.researchSummary}</p>
                  {selectedPlace.audio && selectedPlace.audio.base64 ? (
                    <audio
                      className="place-detail__audio"
                      controls
                      preload="none"
                      src={`data:${selectedPlace.audio.mimeType};base64,${selectedPlace.audio.base64}`}
                    >
                      Tu navegador no puede reproducir este audio.
                    </audio>
                  ) : (
                    <details className="place-detail__script">
                      <summary>
                        {selectedPlace.audio ? 'Leer guion de la audioguía' : 'Audio no disponible; leer guion'}
                      </summary>
                      <p className="body">{selectedPlace.guide.audioScript}</p>
                    </details>
                  )}
                  <div className="place-detail__sources">
                    Fuente: {selectedPlace.place.sourceUrls.map((url, index) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        {selectedPlace.place.source === 'wikipedia' ? 'Wikipedia' : 'OpenStreetMap'}{index + 1 < selectedPlace.place.sourceUrls.length ? ', ' : ''}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          )}

          <button
            type="button"
            className="btn btn--outline btn--wide actions"
            onClick={() => {
              setSelectedId(null);
              setSelectedPlace(null);
              setAttempt((a) => a + 1);
            }}
          >
            Buscar otros lugares
          </button>
        </>
      )}
    </main>
  );
}
