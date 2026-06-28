import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import { getApiUrl } from "./config";

async function fetchApi<T>(path: string): Promise<T> {
  const apiUrl = getApiUrl();

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`);
  } catch {
    throw new Error(
      `Cannot reach the API at ${apiUrl}.`,
    );
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error ?? "Unknown API error");
  }

  return json.data as T;
}

export function getHymns(): Promise<HymnSummary[]> {
  return fetchApi<HymnSummary[]>("/api/hymns");
}

export function getHymn(id: string): Promise<Hymn> {
  return fetchApi<Hymn>(`/api/hymns/${id}`);
}

export function searchHymns(query: string): Promise<HymnSummary[]> {
  const encoded = encodeURIComponent(query);
  return fetchApi<HymnSummary[]>(`/api/hymns/search?q=${encoded}`);
}
