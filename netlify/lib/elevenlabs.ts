// ElevenLabs: voz → texto (Scribe) y texto → voz.
import { env, HttpError } from './http';

const API = 'https://api.elevenlabs.io/v1';

/** Transcribe el audio grabado por el usuario. */
export async function speechToText(audio: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append('model_id', env('ELEVENLABS_STT_MODEL', 'scribe_v1'));
  form.append('language_code', 'spa');
  form.append('file', audio, filename);

  const res = await fetch(`${API}/speech-to-text`, {
    method: 'POST',
    headers: { 'xi-api-key': env('ELEVENLABS_API_KEY') },
    body: form,
  });
  if (!res.ok) throw new HttpError(502, `ElevenLabs STT ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim();
}

/** Convierte texto en audio MP3 para leer los detalles de un punto de interés. */
export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const voice = env('ELEVENLABS_VOICE_ID');
  const res = await fetch(`${API}/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': env('ELEVENLABS_API_KEY'),
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: env('ELEVENLABS_TTS_MODEL', 'eleven_multilingual_v2'),
      language_code: 'es',
    }),
  });
  if (!res.ok) throw new HttpError(502, `ElevenLabs TTS ${res.status}: ${await res.text()}`);
  return res.arrayBuffer();
}
