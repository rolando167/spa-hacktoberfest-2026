const elevenLabsTextToSpeechUrl = "https://api.elevenlabs.io/v1/text-to-speech";
const elevenLabsModelId = "eleven_multilingual_v2";

export type SynthesizedAudio = {
  mimeType: string;
  base64: string;
};

export class AudioGuideUnavailableError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

function elevenLabsConfig(): { apiKey: string; voiceId: string } {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  const voiceId = process.env["ELEVENLABS_VOICE_ID"];
  if (apiKey === undefined || apiKey.length === 0 || voiceId === undefined || voiceId.length === 0) {
    throw new AudioGuideUnavailableError("Audio-guide synthesis is not configured on this server");
  }

  return { apiKey, voiceId };
}

export function assertAudioGuideSynthesisConfigured(): void {
  elevenLabsConfig();
}

export async function synthesizeAudioGuide(text: string): Promise<SynthesizedAudio> {
  const { apiKey, voiceId } = elevenLabsConfig();
  const response = await fetch(
    `${elevenLabsTextToSpeechUrl}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({ text, model_id: elevenLabsModelId }),
      signal: AbortSignal.timeout(45_000),
    },
  );
  if (!response.ok) {
    throw new AudioGuideUnavailableError(
      `Audio-guide synthesis failed with ${response.status} ${response.statusText}`,
    );
  }

  const mimeType = response.headers.get("content-type")?.split(";", 1)[0] ?? "audio/mpeg";
  return {
    mimeType,
    base64: Buffer.from(await response.arrayBuffer()).toString("base64"),
  };
}
