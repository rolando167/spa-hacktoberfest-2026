export type Coordinates = {
  lat: number;
  lon: number;
};

export type PointOfInterestSource = "wikipedia" | "osm";

export type PointOfInterestCandidate = {
  id: string;
  source: PointOfInterestSource;
  name: string;
  coordinates: Coordinates;
  distanceM: number;
  sourceUrl: string;
  evidence: string;
  tags: Record<string, string>;
};

export type SourceStatus =
  | { status: "ok"; count: number }
  | { status: "unavailable"; message: string };

export type NearbyResearchResult = {
  location: Coordinates & { radiusM: number };
  sources: Record<PointOfInterestSource, SourceStatus>;
  rawCandidates: PointOfInterestCandidate[];
};
