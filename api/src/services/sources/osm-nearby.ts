import { distanceInMeters } from "../../lib/geo.js";
import type { Coordinates, PointOfInterestCandidate } from "../../types/point-of-interest.js";
import { fetchJson } from "../http/client.js";

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OsmElement[] };

const overpassUrl = "https://overpass-api.de/api/interpreter";
const overpassTimeoutMs = 30_000;

function coordinatesFor(element: OsmElement): Coordinates | undefined {
  if (element.lat !== undefined && element.lon !== undefined) {
    return { lat: element.lat, lon: element.lon };
  }

  return element.center;
}

export async function findOsmNearby(
  location: Coordinates,
  radiusM: number,
): Promise<PointOfInterestCandidate[]> {
  const around = `${radiusM},${location.lat},${location.lon}`;
  const query = `[out:json][timeout:25];(
    nwr(around:${around})[historic];
    nwr(around:${around})[memorial];
    nwr(around:${around})[inscription];
    nwr(around:${around})[ruins];
    nwr(around:${around})[military=bunker];
    nwr(around:${around})[artwork_type=mural];
    nwr(around:${around})[artwork_type=mosaic];
  );out center tags;`;
  const response = await fetchJson<OverpassResponse>(overpassUrl, {
    method: "POST",
    body: new URLSearchParams({ data: query }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(overpassTimeoutMs),
  });

  return (response.elements ?? []).flatMap((element) => {
    const coordinates = coordinatesFor(element);
    if (coordinates === undefined) {
      return [];
    }

    const tags = element.tags ?? {};
    const name =
      tags["name"] ?? tags["inscription"] ?? `Unnamed historic feature (${element.type}/${element.id})`;
    const evidence =
      tags["inscription"] ??
      tags["description"] ??
      tags["historic"] ??
      tags["memorial"] ??
      "Historic OSM feature";

    return [
      {
        id: `osm:${element.type}/${element.id}`,
        source: "osm",
        name,
        coordinates,
        distanceM: distanceInMeters(location, coordinates),
        sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        evidence,
        tags,
      },
    ];
  });
}
