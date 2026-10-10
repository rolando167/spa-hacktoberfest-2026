import { distanceInMeters } from "../../lib/geo.js";
import type { Coordinates, PointOfInterestCandidate } from "../../types/point-of-interest.js";
import { fetchJson } from "../http/client.js";

type WikipediaGeoSearchResponse = {
  query?: {
    geosearch?: Array<{
      pageid: number;
      title: string;
      lat: number;
      lon: number;
    }>;
  };
};

type WikipediaExtractResponse = {
  query?: {
    pages?: Record<string, { extract?: string }>;
  };
};

async function extractsFor(pageIds: number[]): Promise<Map<number, string>> {
  if (pageIds.length === 0) {
    return new Map();
  }

  const query = new URLSearchParams({
    action: "query",
    format: "json",
    pageids: pageIds.join("|"),
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    exsentences: "4",
    origin: "*",
  });
  const response = await fetchJson<WikipediaExtractResponse>(
    `https://es.wikipedia.org/w/api.php?${query.toString()}`,
  );
  const extracts = new Map<number, string>();

  for (const [pageId, page] of Object.entries(response.query?.pages ?? {})) {
    const extract = page.extract?.replaceAll(/\s+/g, " ").trim();
    if (extract !== undefined && extract.length > 0) {
      extracts.set(Number(pageId), extract.slice(0, 600));
    }
  }

  return extracts;
}

export async function findWikipediaNearby(
  location: Coordinates,
  radiusM: number,
): Promise<PointOfInterestCandidate[]> {
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    list: "geosearch",
    gscoord: `${location.lat}|${location.lon}`,
    gsradius: String(radiusM),
    gslimit: "50",
    gsnamespace: "0",
    origin: "*",
  });
  const url = `https://es.wikipedia.org/w/api.php?${query.toString()}`;
  const response = await fetchJson<WikipediaGeoSearchResponse>(url);
  const articles = response.query?.geosearch ?? [];
  let extracts = new Map<number, string>();

  try {
    extracts = await extractsFor(articles.map((article) => article.pageid));
  } catch {
    // GeoSearch results remain useful if the optional contextual lookup is unavailable.
  }

  return articles.map((article) => {
    const coordinates = { lat: article.lat, lon: article.lon };

    return {
      id: `wiki:${article.pageid}`,
      source: "wikipedia",
      name: article.title,
      coordinates,
      distanceM: distanceInMeters(location, coordinates),
      sourceUrl: `https://es.wikipedia.org/?curid=${article.pageid}`,
      evidence: extracts.get(article.pageid) ?? `Geolocated Spanish Wikipedia article: ${article.title}`,
      tags: { pageId: String(article.pageid) },
    };
  });
}
