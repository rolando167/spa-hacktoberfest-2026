import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { PoiPhoto } from '../components/PoiCard';
import { ArrowRightIcon, CheckIcon, NavIcon, SpeakerIcon } from '../components/icons';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWakeLock } from '../hooks/useWakeLock';
import { USE_MOCKS } from '../lib/api';
import { FALLBACK_POSITION, distanceMeters, formatDistance, walkMinutes } from '../lib/geo';
import type { LatLng } from '../lib/types';
import { useAppState } from '../state/AppState';

/** Radio de llegada a una parada, en metros. */
const GEOFENCE_M = 30;
/** Lecturas seguidas dentro del radio para dar la llegada por buena (evita saltos del GPS). */
const READINGS_TO_ARRIVE = 2;

export function NavigateScreen() {
  const navigate = useNavigate();
  const { route } = useAppState();
  const geo = useGeolocation();
  useWakeLock(true);

  const [simPos, setSimPos] = useState<LatLng | null>(null);
  const [next, setNext] = useState(0); // parada hacia la que vas
  const [arrived, setArrived] = useState<number | null>(null); // parada en la que estás
  const [follow, setFollow] = useState(true);
  const insideCount = useRef(0);

  const position = simPos ?? geo.position ?? FALLBACK_POSITION;
  const stops = route?.stops ?? [];
  const target = stops[next];
  const finished = !!route && next >= stops.length;
  const dist = target ? distanceMeters(position, target.position) : 0;

  // Detección de llegada (geovalla)
  useEffect(() => {
    if (!target || arrived !== null) return;
    if (dist <= GEOFENCE_M) {
      insideCount.current += 1;
      const needed = simPos ? 1 : READINGS_TO_ARRIVE;
      if (insideCount.current >= needed) {
        insideCount.current = 0;
        setArrived(next);
        navigator.vibrate?.(200);
      }
    } else {
      insideCount.current = 0;
    }
    // Cada nueva posición es una lectura
  }, [position.lat, position.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!route) return <Navigate to="/inicio" replace />;

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    window.speechSynthesis.speak(u);
  }

  function continueRoute() {
    window.speechSynthesis?.cancel();
    setArrived(null);
    setNext((n) => n + 1);
    setFollow(true);
  }

  const remainingMeters =
    dist + stops.slice(next + 1).reduce((acc, s, i) => acc + distanceMeters(stops[next + i].position, s.position), 0);
  const arrivedStop = arrived !== null ? stops[arrived] : null;

  return (
    <main className="nav">
      <MapView
        className="map--full"
        position={position}
        accuracy={simPos ? null : geo.accuracy}
        heading={geo.heading}
        route={route}
        nextStopIndex={arrived ?? next}
        highlightStopIndex={arrived}
        geofenceMeters={arrived === null ? GEOFENCE_M : undefined}
        follow={follow}
        onUserPan={() => setFollow(false)}
        onRecenter={() => setFollow(true)}
        zoom={17}
      />

      {!arrivedStop && !finished && target && (
        <div className="nav__instruction">
          <span className="nav__instruction-icon">
            <NavIcon size={22} />
          </span>
          <span className="nav__instruction-text">
            <strong>{formatDistance(dist)}</strong>
            <span>
              Hacia la parada {next + 1} · {target.name}
            </span>
          </span>
          <span className="nav__instruction-time">{walkMinutes(dist)} min</span>
        </div>
      )}

      {arrivedStop && (
        <div className="nav__arrived-pill">
          <CheckIcon size={16} /> Has llegado · parada {arrived! + 1} de {stops.length}
        </div>
      )}

      {!arrivedStop && (
        <button
          type="button"
          className={`nav__follow ${follow ? 'is-on' : ''}`}
          onClick={() => setFollow(true)}
          aria-pressed={follow}
        >
          <NavIcon size={16} /> {follow ? 'Siguiéndote' : 'Recentrar'}
        </button>
      )}

      {/* Simulador para probar en escritorio. Solo con datos simulados. */}
      {USE_MOCKS && target && arrived === null && (
        <button type="button" className="nav__sim" onClick={() => setSimPos(target.position)}>
          Simular llegada
        </button>
      )}

      {arrivedStop ? (
        <section className="sheet sheet--arrival" aria-live="polite">
          <span className="sheet__grip" aria-hidden="true" />
          <PoiPhoto poi={arrivedStop} className="sheet__photo" />
          <div className="stack-xs">
            <h1 className="display display--sm">
              <span className="badge badge--accent">{arrived! + 1}</span>
              {arrivedStop.name}
            </h1>
            <span className="muted small">
              {arrivedStop.indoor ? 'Bajo techo · ' : ''}tiempo sugerido {arrivedStop.suggestedMinutes} min
            </span>
          </div>
          <p className="body">{arrivedStop.detail}</p>
          <div className="row">
            <button type="button" className="btn btn--pill" onClick={() => speak(`${arrivedStop.name}. ${arrivedStop.detail}`)}>
              <SpeakerIcon size={18} /> Escuchar
            </button>
          </div>
          <div className="grow" />
          <button type="button" className="btn btn--primary btn--big" onClick={continueRoute}>
            {arrived! + 1 < stops.length
              ? `Seguir a la parada ${arrived! + 2} · ${stops[arrived! + 1].walkMinutesFromPrev} min`
              : 'Terminar ruta'}
            <ArrowRightIcon />
          </button>
        </section>
      ) : (
        <section className="sheet">
          <span className="sheet__grip" aria-hidden="true" />
          <div className="row between baseline">
            <strong className="display display--xs">{route.title}</strong>
            {!finished && (
              <span className="muted small">
                {walkMinutes(remainingMeters)} min · {formatDistance(remainingMeters)}
              </span>
            )}
          </div>
          {finished ? (
            <p className="body">Ruta completada. ¿Buscamos otra?</p>
          ) : (
            <>
              <ol className="progress" aria-label="Progreso de la ruta">
                {stops.map((s, i) => (
                  <li key={s.id} className={i < next ? 'is-done' : i === next ? 'is-next' : ''}>
                    <span className="progress__bar" />
                    <span className="progress__dot" />
                    <span className="sr-only">{s.name}</span>
                  </li>
                ))}
              </ol>
              <div className="progress__labels muted small">
                <span>Salida</span>
                {stops.map((_, i) => (
                  <span key={i}>Parada {i + 1}</span>
                ))}
              </div>
            </>
          )}
          <div className="row">
            <button type="button" className="btn btn--outline btn--grow" onClick={() => navigate('/inicio')}>
              Terminar
            </button>
            <button type="button" className="btn btn--soft btn--grow" onClick={() => navigate('/ruta')}>
              Ver paradas
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
