import type {
  Coordinates,
  NearbyResearchResult,
  PointOfInterestCandidate,
  PointOfInterestSource,
  SourceStatus,
} from "../types/point-of-interest.js";
import { findOsmNearby } from "./sources/osm-nearby.js";
import { findWikipediaNearby } from "./sources/wikipedia-nearby.js";

type ResearchLocation = Coordinates & { radiusM: number };

const cacheTtlMs = 5 * 60 * 1_000;
const researchCache = new Map<string, { expiresAt: number; result: NearbyResearchResult }>();

function cacheKey(location: ResearchLocation): string {
  return `${location.lat.toFixed(4)}:${location.lon.toFixed(4)}:${location.radiusM}`;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown source error";
}

function sourceOutcome(
  source: PointOfInterestSource,
  outcome: PromiseSettledResult<PointOfInterestCandidate[]>,
): { source: PointOfInterestSource; candidates: PointOfInterestCandidate[]; status: SourceStatus } {
  if (outcome.status === "fulfilled") {
    return {
      source,
      candidates: outcome.value,
      status: { status: "ok", count: outcome.value.length },
    };
  }

  return {
    source,
    candidates: [],
    status: { status: "unavailable", message: messageFor(outcome.reason) },
  };
}

export class AllSourcesUnavailableError extends Error {
  public constructor() {
    super("All nearby-place sources are currently unavailable");
  }
}

export async function researchNearby(location: ResearchLocation): Promise<NearbyResearchResult> {
  const key = cacheKey(location);
  const cached = researchCache.get(key);
  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const outcomes = await Promise.allSettled([
    findWikipediaNearby(location, location.radiusM),
    findOsmNearby(location, location.radiusM),
  ]);
  const wikipedia = sourceOutcome("wikipedia", outcomes[0]);
  const osm = sourceOutcome("osm", outcomes[1]);

  if (wikipedia.candidates.length === 0 && osm.candidates.length === 0 &&
      wikipedia.status.status === "unavailable" && osm.status.status === "unavailable") {
    throw new AllSourcesUnavailableError();
  }

  const result: NearbyResearchResult = {
    location,
    sources: {
      wikipedia: wikipedia.status,
      osm: osm.status,
    },
    rawCandidates: [...wikipedia.candidates, ...osm.candidates].sort(
      (first, second) => first.distanceM - second.distanceM,
    ),
  };

  researchCache.set(key, { expiresAt: Date.now() + cacheTtlMs, result });
  return result;
}
