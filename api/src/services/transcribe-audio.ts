const elevenLabsSpeechToTextUrl = "https://api.elevenlabs.io/v1/speech-to-text";
const elevenLabsModelId = "scribe_v2";

type ElevenLabsSpeechToTextResponse = {
  text?: unknown;
};

export class VoiceInputUnavailableError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export async function transcribeAudio(audio: File): Promise<string> {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (apiKey === undefined || apiKey.length === 0) {
    throw new VoiceInputUnavailableError("Voice input is not configured on this server");
  }

  const form = new FormData();
  form.set("model_id", elevenLabsModelId);
  form.set("file", audio, audio.name || "recording.webm");

  const response = await fetch(elevenLabsSpeechToTextUrl, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new VoiceInputUnavailableError(
      `Voice transcription failed with ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as ElevenLabsSpeechToTextResponse;
  if (typeof payload.text !== "string" || payload.text.trim().length === 0) {
    throw new VoiceInputUnavailableError("Voice transcription did not contain text");
  }

  return payload.text.trim();
}
