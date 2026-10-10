import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { describeMadrid } from "./services/describe-madrid.js";
import { curateNearby } from "./services/curate-nearby.js";
import { AllSourcesUnavailableError, researchNearby } from "./services/research-nearby.js";
import { transcribeAudio, VoiceInputUnavailableError } from "./services/transcribe-audio.js";

export const app = new Hono();

app.get("/health", (context) => context.json({ status: "ok" }));

const nearbyResearchRequest = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lon: z.coerce.number().finite().min(-180).max(180),
  radiusM: z.coerce.number().finite().int().min(100).max(1_000).default(400),
  interestHint: z.string().trim().min(1).max(1_000).optional(),
});

const maxAudioBytes = 25 * 1_024 * 1_024;

const selectedPlaceRequest = z.object({
  candidateId: z.string().trim().min(1).max(200),
});

const hardcodedPlaceGuide = {
  title: "The hidden layers of La Latina",
  summary:
    "This prototype guide follows traces of medieval Madrid that still surface in the streets around La Latina.",
  audioGuide: {
    language: "en",
    script:
      "Look closely at the buildings around you. Beneath the lively streets of La Latina are layers of medieval Madrid: walls, gates, hospitals, and the daily routes of people who lived here centuries ago.",
  },
};

type NearbyResearchInput = z.infer<typeof nearbyResearchRequest> & {
  audio?: File;
};

function parseNearbyRequest(input: unknown): z.infer<typeof nearbyResearchRequest> {
  const parsed = nearbyResearchRequest.safeParse(input);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid nearby-research request" });
  }

  return parsed.data;
}

function parseSelectedPlaceRequest(input: unknown): z.infer<typeof selectedPlaceRequest> {
  const parsed = selectedPlaceRequest.safeParse(input);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid selected-place request" });
  }

  return parsed.data;
}

function validateAudio(audio: File): File {
  if (!audio.type.startsWith("audio/")) {
    throw new HTTPException(400, { message: "audio must be an audio file" });
  }
  if (audio.size === 0 || audio.size > maxAudioBytes) {
    throw new HTTPException(400, { message: "audio must be between 1 byte and 25 MB" });
  }

  return audio;
}

async function parseNearbyResearchInput(context: Context): Promise<NearbyResearchInput> {
  const contentType = context.req.header("content-type") ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    const form = await context.req.formData();
    const audioValue = form.get("audio");
    const input = parseNearbyRequest({
      lat: form.get("lat"),
      lon: form.get("lon"),
      radiusM: form.get("radiusM") ?? undefined,
      interestHint: form.get("interestHint") ?? undefined,
    });

    if (audioValue === null) {
      return input;
    }
    if (!(audioValue instanceof File)) {
      throw new HTTPException(400, { message: "audio must be a file" });
    }

    return { ...input, audio: validateAudio(audioValue) };
  }

  if (contentType.startsWith("application/json")) {
    return parseNearbyRequest(await context.req.json());
  }

  throw new HTTPException(415, { message: "Use application/json or multipart/form-data" });
}

app.post("/api/describe-madrid", async (context) => {
  const description = await describeMadrid();

  return context.json({ description });
});

app.post("/api/selected-place", async (context) => {
  const { candidateId } = parseSelectedPlaceRequest(await context.req.json());

  return context.json({
    candidateId,
    guide: hardcodedPlaceGuide,
  });
});

app.post("/api/research-nearby", async (context) => {
  try {
    const { audio, interestHint: typedInterestHint, ...location } = await parseNearbyResearchInput(context);
    const transcript = audio === undefined ? undefined : await transcribeAudio(audio);
    const interestHint = [typedInterestHint, transcript].filter((hint): hint is string => hint !== undefined).join("\n");
    const research = await researchNearby(location);
    const suggestions = await curateNearby(research.rawCandidates, {
      interestHint: interestHint.length === 0 ? undefined : interestHint,
    });

    return context.json({
      ...research,
      suggestions,
      userIntent: {
        source: audio === undefined ? (typedInterestHint === undefined ? "none" : "text") : "voice",
        ...(transcript === undefined ? {} : { transcript }),
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    if (error instanceof AllSourcesUnavailableError) {
      return context.json({ error: error.message }, 503);
    }
    if (error instanceof VoiceInputUnavailableError) {
      return context.json({ error: error.message }, 503);
    }

    throw error;
  }
});
