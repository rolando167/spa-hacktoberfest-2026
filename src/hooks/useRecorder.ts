import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 30;

/** Elige un formato que el navegador sepa grabar. Safari (iOS) graba mp4; Chrome y Firefox, webm/opus. */
function pickMime(): string | undefined {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return options.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t));
}

export type RecorderState = 'idle' | 'recording' | 'error';

export function useRecorder(onDone: (audio: Blob) => void) {
  const [state, setState] = useState<RecorderState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState<number[]>(Array(24).fill(0));
  const [error, setError] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const raf = useRef<number | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const cancelled = useRef(false);

  const cleanup = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    audioCtx.current?.close().catch(() => {});
    timer.current = raf.current = null;
    stream.current = null;
    audioCtx.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelled.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = pickMime();
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      cancelled.current = false;
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        cleanup();
        setState('idle');
        if (!cancelled.current) onDone(new Blob(chunks.current, { type: rec.mimeType }));
      };
      recorder.current = rec;
      rec.start();
      setState('recording');
      setSeconds(0);

      // Temporizador con corte a los 30 s
      const t0 = Date.now();
      timer.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        setSeconds(s);
        if (s >= MAX_SECONDS) stop();
      }, 250);

      // Onda: nivel de volumen para pintar las barras
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      ctx.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        setLevel((prev) => [...prev.slice(1), avg]);
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      cleanup();
      setState('error');
      setError('No hay acceso al micrófono. Revisa los permisos del navegador.');
    }
  }, [cleanup, onDone, stop]);

  return { state, seconds, level, error, start, stop, cancel, maxSeconds: MAX_SECONDS };
}
