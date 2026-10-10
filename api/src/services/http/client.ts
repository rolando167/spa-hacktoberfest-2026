const userAgent = "MadridHiddenPlacesHackathon/0.1";
const requestTimeoutMs = 20_000;

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent,
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}
