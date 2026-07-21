import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import { getApiUrl } from "./config";
import {
  readCachedHymnSummaries,
  readHymnFromCache,
  saveHymnToCache,
} from "./cache/hymnCache";
import type { CachedHymnRecord } from "./cache/types";

const FETCH_TIMEOUT_MS = 4000;

async function fetchApi<T>(path: string): Promise<T> {
  const apiUrl = getApiUrl();


  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);


  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Connection timed out. Check your internet connection and try again.",
      );
    }
    throw new Error(
      "Unable to connect. You're offline or the server is unavailable. Try again when you're back online.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(
      "Something went wrong loading data. Please try again in a moment.",
    );
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(
      typeof json.error === "string" && json.error.trim()
        ? json.error
        : "Something went wrong. Please try again.",
    );
  }

  return json.data as T;
}

function hymnFromCacheRecord(record: CachedHymnRecord): Hymn {
  return {
    ...record.hymn,
    imageUrls:
      record.localImagePaths.length > 0
        ? record.localImagePaths
        : record.hymn.imageUrls,
  };
}

export function getHymns(): Promise<HymnSummary[]> {
  return fetchApi<HymnSummary[]>("/api/hymns");
}

/** Favorites list: network first, then cached hymns for the given ids. */
export async function getFavoriteHymnSummaries(
  favoriteIds: string[],
): Promise<HymnSummary[]> {
  if (favoriteIds.length === 0) return [];

  try {
    const all = await getHymns();
    const idSet = new Set(favoriteIds);
    return all.filter((hymn) => idSet.has(hymn.id));
  } catch {
    return readCachedHymnSummaries(favoriteIds);
  }
}

export async function getHymn(id: string): Promise<Hymn> {
  try {
    const hymn = await fetchApi<Hymn>(`/api/hymns/${id}`);

    try {
      const cached = await saveHymnToCache(hymn);
      return hymnFromCacheRecord(cached);
    } catch {
      // Network succeeded; caching is best-effort
      return hymn;
    }
  } catch (networkError) {
    const record = await readHymnFromCache(id);
    if (record) {
      return hymnFromCacheRecord(record);
    }

    throw networkError;
  }
}

export function searchHymns(query: string): Promise<HymnSummary[]> {
  const encoded = encodeURIComponent(query);
  return fetchApi<HymnSummary[]>(`/api/hymns/search?q=${encoded}`);
}
