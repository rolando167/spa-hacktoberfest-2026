import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, nowLabel } from '../components/Header';
import { IntentChips } from '../components/IntentChips';
import { MapView } from '../components/MapView';
import { ArrowRightIcon, MicIcon } from '../components/icons';
import { useGeolocation } from '../hooks/useGeolocation';
import { useRecorder } from '../hooks/useRecorder';
import { detectIntent } from '../lib/api';
import { FALLBACK_POSITION } from '../lib/geo';
import { useAppState } from '../state/AppState';

type Phase = 'idle' | 'recording' | 'processing' | 'detected' | 'error';

export function Home() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { intent, setIntent, setRoute } = useAppState();
  const [phase, setPhase] = useState<Phase>(intent ? 'detected' : 'idle');
  const [error, setError] = useState<string | null>(null);

  const onAudio = useCallback(
    async (audio: Blob) => {
      setPhase('processing');
      try {
        const res = await detectIntent(audio, geo.position);
        setIntent(res);
        setRoute(null);
        setPhase('detected');
      } catch (e) {
        setError((e as Error).message || 'No he podido entenderte. Prueba otra vez.');
        setPhase('error');
      }
    },
    [setIntent, setRoute, geo.position],
  );

  const rec = useRecorder(onAudio);
  const recording = rec.state === 'recording';
  const position = geo.position ?? FALLBACK_POSITION;
  const canSuggest = phase === 'detected' && !!intent;

  async function startRecording() {
    setError(null);
    await rec.start();
    setPhase('recording');
  }

  const title = recording ? 'Te escucho…' : phase === 'processing' ? 'Pensando…' : canSuggest ? 'Entendido' : '¿Qué ruta buscas hoy?';
  const reach = canSuggest && intent.intent.maxMinutes ? intent.intent.maxMinutes * 80 : null;

  return (
    <main className="screen">
      <Header kicker={nowLabel()} title={title} />

      <MapView
        className={recording || canSuggest ? 'map--short' : ''}
        position={position}
        accuracy={geo.accuracy}
        heading={geo.heading}
        follow
        reachMeters={reach}
        zoom={reach ? 15 : 16}
      />
      <p className="map-caption">
        <span className="dot dot--user" />
        {geo.position
          ? `Estás aquí · precisión ${Math.round(geo.accuracy ?? 0)} m`
          : geo.error ?? 'Buscando tu ubicación…'}
      </p>

      {canSuggest && (
        <section className="card">
          <div className="card__head">
            <span className="eyebrow">Lo que buscas</span>
            <button type="button" className="link" onClick={startRecording}>
              Repetir
            </button>
          </div>
          <IntentChips tags={intent.intent.tags} />
          <p className="muted quote">«{intent.transcript}»</p>
        </section>
      )}

      {!canSuggest && !recording && (
        <div className="stack-sm">
          <button type="button" className="btn btn--disabled" disabled>
            Sugerir ruta
          </button>
          <p className="muted center small">
            {phase === 'processing' ? 'Detectando lo que buscas…' : 'Cuéntame qué buscas y se activará.'}
          </p>
          {(error || rec.error) && <p className="error center small">{error ?? rec.error}</p>}
        </div>
      )}

      <div className="grow" />

      {recording ? (
        <section className="rec" aria-live="polite">
          <div className="rec__head">
            <span className="rec__live">
              <span className="dot dot--rec" /> Grabando
            </span>
            <span className="rec__time">
              {Math.floor(rec.seconds / 60)}:{String(rec.seconds % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="rec__wave" aria-hidden="true">
            {rec.level.map((v, i) => (
              <span key={i} style={{ height: `${8 + Math.min(1, v * 2.2) * 40}px` }} />
            ))}
          </div>
          <div className="rec__actions">
            <button type="button" className="link link--light" onClick={rec.cancel}>
              Cancelar
            </button>
            <button type="button" className="rec__stop" aria-label="Terminar grabación" onClick={rec.stop}>
              <span />
            </button>
            <span className="rec__max">máx. 0:{rec.maxSeconds}</span>
          </div>
        </section>
      ) : canSuggest ? (
        <button type="button" className="btn btn--primary btn--big" onClick={() => navigate('/ruta')}>
          Sugerir ruta <ArrowRightIcon />
        </button>
      ) : (
        <button type="button" className="talk" onClick={startRecording} disabled={phase === 'processing'}>
          <span className="talk__text">
            <strong>Toca y dime qué buscas</strong>
            <span className="muted small">«Llueve, algo bajo techo y corto»</span>
          </span>
          <span className="talk__mic">
            <MicIcon size={26} />
          </span>
        </button>
      )}
    </main>
  );
}
