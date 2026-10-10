import { generateObject } from "ai";
import { z } from "zod";

import type { PointOfInterestCandidate } from "../types/point-of-interest.js";
import { madridLlm, madridModelId } from "./llm.js";

const maxSuggestions = 5;

const curationSchema = z.object({
  suggestions: z.array(
    z.object({
      candidateId: z.string(),
      title: z.string().min(1).max(100),
      whyInteresting: z.string().min(1).max(280),
      historicalTheme: z.string().min(1).max(80),
    }),
  ).max(maxSuggestions),
});

export type CuratedPointOfInterest = z.infer<typeof curationSchema>["suggestions"][number];

type CurationOptions = {
  interestHint?: string | undefined;
};

function candidatesForPrompt(candidates: PointOfInterestCandidate[]): unknown[] {
  return candidates.map((candidate) => ({
    id: candidate.id,
    source: candidate.source,
    name: candidate.name,
    distanceM: candidate.distanceM,
    evidence: candidate.evidence,
    tags: candidate.tags,
  }));
}

export async function curateNearby(
  candidates: PointOfInterestCandidate[],
  options: CurationOptions = {},
): Promise<CuratedPointOfInterest[]> {
  if (candidates.length === 0) {
    return [];
  }

  const interestContext =
    options.interestHint === undefined
      ? "No stated personal interests; choose broadly compelling local history."
      : `User interests (possibly transcribed from speech): ${options.interestHint}`;
  const { object } = await generateObject({
    model: madridLlm.chat(madridModelId),
    schema: curationSchema,
    system: `You curate hidden local-history discoveries in Madrid. Select up to ${maxSuggestions} genuinely interesting, source-backed places.`,
    prompt: `
${interestContext}

Choose only candidate IDs from the provided records. Never invent a place, candidate ID,
historical fact, date, inscription, or event. Prefer small, overlooked discoveries with
specific evidence: plaques, inscriptions, fragments, ruins, unusual streets, or buildings
with a concrete historical connection. Avoid obvious tourist highlights, restaurants,
transport stations, and generic churches unless the supplied evidence reveals a notably
overlooked story. If several records describe one place, pick only one representative.

For each selection, make whyInteresting a concise paraphrase grounded strictly in its
evidence. historicalTheme should be a short label such as "Habsburg Madrid", "Civil War",
"Mayrit", or "neighbourhood memory"; use "Local history" when the evidence cannot support
a more precise theme.

Candidates:
${JSON.stringify(candidatesForPrompt(candidates))}
`,
  });

  const validIds = new Set(candidates.map((candidate) => candidate.id));
  const seenIds = new Set<string>();

  // Schema validation ensures the object is well-formed; this check additionally prevents
  // an otherwise valid model response from referring to an invented source record.
  return object.suggestions.filter((suggestion) => {
    if (!validIds.has(suggestion.candidateId) || seenIds.has(suggestion.candidateId)) {
      return false;
    }

    seenIds.add(suggestion.candidateId);
    return true;
  });
}
