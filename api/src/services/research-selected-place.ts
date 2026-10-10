import { fetchJson } from "./http/client.js";
import { fetchPageAsMarkdown } from "./http/page-fetcher.js";

export type SelectedPlaceResearch = {
  candidateId: string;
  name: string;
  source: "wikipedia" | "osm";
  sourceUrls: string[];
  sourceMaterial: string;
};

type WikipediaPageResponse = {
  query?: {
    pages?: Record<string, { title?: string; extract?: string; fullurl?: string }>;
  };
};

type OverpassResponse = {
  elements?: Array<{
    type: "node" | "way" | "relation";
    id: number;
    tags?: Record<string, string>;
  }>;
};

const wikipediaApiUrl = "https://es.wikipedia.org/w/api.php";
const overpassUrl = "https://overpass-api.de/api/interpreter";

function compactText(text: string, maximumLength: number): string {
  return text.replaceAll(/\s+/g, " ").trim().slice(0, maximumLength);
}

async function researchWikipedia(candidateId: string, pageId: string): Promise<SelectedPlaceResearch> {
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    pageids: pageId,
    prop: "extracts|info",
    explaintext: "1",
    inprop: "url",
    redirects: "1",
    origin: "*",
  });
  const response = await fetchJson<WikipediaPageResponse>(`${wikipediaApiUrl}?${query.toString()}`, {
    signal: AbortSignal.timeout(20_000),
  });
  const page = Object.values(response.query?.pages ?? {})[0];
  if (page?.title === undefined || page.extract === undefined || page.fullurl === undefined) {
    throw new Error("Wikipedia did not return research material for this candidate");
  }

  let pageMarkdown = "";
  try {
    pageMarkdown = compactText(await fetchPageAsMarkdown(page.fullurl), 8_000);
  } catch {
    // The canonical Wikipedia extract remains useful if the optional reader is unavailable.
  }

  return {
    candidateId,
    name: page.title,
    source: "wikipedia",
    sourceUrls: [page.fullurl],
    sourceMaterial: [compactText(page.extract, 8_000), pageMarkdown].filter(Boolean).join("\n\n"),
  };
}

async function researchOsm(
  candidateId: string,
  elementType: "node" | "way" | "relation",
  elementId: string,
): Promise<SelectedPlaceResearch> {
  const fallbackUrl = `https://www.openstreetmap.org/${elementType}/${elementId}`;

  try {
    const query = `[out:json][timeout:60];${elementType}(${elementId});out tags;`;
    const response = await fetchJson<OverpassResponse>(overpassUrl, {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(60_000),
    });
    const element = response.elements?.[0];
    if (element === undefined) {
      throw new Error("OpenStreetMap did not return research material for this candidate");
    }

    const tags = element.tags ?? {};
    const name = tags["name"] ?? tags["inscription"] ?? `OSM ${element.type}/${element.id}`;
    return {
      candidateId,
      name,
      source: "osm",
      sourceUrls: [fallbackUrl],
      sourceMaterial: JSON.stringify(tags),
    };
  } catch (error) {
    const fallbackName = `Lugar histórico (${elementType}/${elementId})`;
    return {
      candidateId,
      name: fallbackName,
      source: "osm",
      sourceUrls: [fallbackUrl],
      sourceMaterial: JSON.stringify({
        note: "OpenStreetMap lookup timed out or was unavailable; this is a minimal fallback generated to keep the app usable.",
        candidateId,
        elementType,
        elementId,
        originalError: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}

export async function researchSelectedPlace(candidateId: string): Promise<SelectedPlaceResearch> {
  const wikipediaMatch = /^wiki:(\d+)$/.exec(candidateId);
  const wikipediaPageId = wikipediaMatch?.[1];
  if (wikipediaPageId !== undefined) {
    return researchWikipedia(candidateId, wikipediaPageId);
  }

  const osmMatch = /^osm:(node|way|relation)\/(\d+)$/.exec(candidateId);
  const osmType = osmMatch?.[1];
  const osmId = osmMatch?.[2];
  if (osmType !== undefined && osmId !== undefined) {
    return researchOsm(candidateId, osmType as "node" | "way" | "relation", osmId);
  }

  throw new Error("Unsupported candidate ID");
}
