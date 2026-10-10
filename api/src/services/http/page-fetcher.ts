const jinaReaderPrefix = "https://r.jina.ai/";

/**
 * Fetches a human-readable page through Jina Reader, a keyless reader endpoint.
 * Discovery adapters use direct JSON APIs; this is reserved for later enrichment.
 */
export async function fetchPageAsMarkdown(url: string): Promise<string> {
  const response = await fetch(`${jinaReaderPrefix}${url}`, {
    headers: { Accept: "text/plain" },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Page fetch failed with ${response.status} ${response.statusText}`);
  }

  return response.text();
}
