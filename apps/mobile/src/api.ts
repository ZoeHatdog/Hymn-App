import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import { compareHymnsByLibraryAndPage } from "@hymn-app/shared-utils";
import { getApiUrl } from "./config";
import {
  clearAllHymnCache,
  clearIncompleteHymnDirs,
  existingLocalImagePaths,
  isHymnCacheComplete,
  isHymnCacheStale,
  isHymnCached,
  readCachedHymnSummaries,
  readHymnFromCache,
  readHymnSummaryIndex,
  saveHymnSummaryIndex,
  saveHymnToCache,
} from "./cache/hymnCache";
import {
  assertEnoughDiskSpace,
  DISK_RECHECK_EVERY,
  estimateCacheBytes,
  getFreeDiskBytes,
  SAFETY_BUFFER_BYTES,
} from "./cache/disk";
import { isCacheError, toCacheError } from "./cache/errors";
import type { CachedHymnRecord, SaveAllHymnsResult } from "./cache/types";

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

/** Offline fallback: prefer complete cache; otherwise lyrics + any surviving local pages. */
function hymnFromCacheRecordOffline(record: CachedHymnRecord): Hymn {
  if (isHymnCacheComplete(record)) {
    return hymnFromCacheRecord(record);
  }
  return {
    ...record.hymn,
    imageUrls: existingLocalImagePaths(record),
  };
}

export async function getHymns(): Promise<HymnSummary[]> {
  try {
    const list = await fetchApi<HymnSummary[]>("/api/hymns");
    void saveHymnSummaryIndex(list);
    return list;
  } catch (err) {
    const cached = await readHymnSummaryIndex();
    if (cached && cached.length > 0) return cached;
    throw err;
  }
}

/** Favorites list: network first, then complete cached hymns for the given ids. */
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
      // Network succeeded; caching is best-effort for normal browsing
      return hymn;
    }
  } catch (networkError) {
    const record = await readHymnFromCache(id);
    if (record) {
      return hymnFromCacheRecordOffline(record);
    }

    throw networkError;
  }
}

export async function searchHymns(query: string): Promise<HymnSummary[]> {
  const encoded = encodeURIComponent(query);

  try {
    return await fetchApi<HymnSummary[]>(`/api/hymns/search?q=${encoded}`);
  } catch (err) {
    const cached = await readHymnSummaryIndex();
    if (!cached) throw err;

    const q = query.trim().toLowerCase();
    if (!q) return [];

    return cached
      .filter(
        (hymn) =>
          hymn.title.toLowerCase().includes(q) ||
          hymn.author.toLowerCase().includes(q) ||
          (hymn.library?.toLowerCase().includes(q) ?? false),
      )
      .sort(compareHymnsByLibraryAndPage);
  }
}

export async function saveAllHymnsToCache(
  onProgress?: (done: number, total: number) => void,
): Promise<SaveAllHymnsResult> {
  const summaries = await getHymns();
  const total = summaries.length;
  const failedIds: string[] = [];
  let saved = 0;
  let skipped = 0;
  let failed = 0;
  let abortedReason: SaveAllHymnsResult["abortedReason"];

  let needCount = 0;
  for (const summary of summaries) {
    if (!(await isHymnCached(summary.id))) {
      needCount += 1;
    }
  }

  const estimateBytes = estimateCacheBytes(needCount);
  let freeBytes = await getFreeDiskBytes();

  if (needCount > 0) {
    try {
      assertEnoughDiskSpace(freeBytes, needCount);
    } catch (err) {
      if (isCacheError(err) && err.reason === "storage") {
        return {
          saved: 0,
          skipped: 0,
          failed: 0,
          total,
          abortedReason: "storage",
          failedIds: [],
          estimateBytes,
          freeBytes,
        };
      }
      throw err;
    }
  }

  for (let i = 0; i < summaries.length; i++) {
    const id = summaries[i].id;

    if (i > 0 && i % DISK_RECHECK_EVERY === 0) {
      freeBytes = await getFreeDiskBytes();
      if (freeBytes < SAFETY_BUFFER_BYTES) {
        clearIncompleteHymnDirs(id);
        abortedReason = "storage";
        break;
      }
    }

    try {
      const hymn = await fetchApi<Hymn>(`/api/hymns/${id}`);
      const existing = await readHymnFromCache(id);

      if (
        existing &&
        !isHymnCacheStale(existing, hymn) &&
        isHymnCacheComplete(existing)
      ) {
        skipped++;
      } else {
        await saveHymnToCache(hymn);
        saved++;
      }
      onProgress?.(i + 1, total);
    } catch (err) {
      const cacheErr = toCacheError(err);
      clearIncompleteHymnDirs(id);

      if (cacheErr.reason === "storage") {
        failedIds.push(id);
        abortedReason = "storage";
        onProgress?.(saved + skipped + failed, total);
        break;
      }

      failed++;
      failedIds.push(id);
      onProgress?.(i + 1, total);
    }
  }

  if (abortedReason === "storage" && saved + skipped + failed < total) {
    onProgress?.(saved + skipped + failed, total);
  }

  return {
    saved,
    skipped,
    failed,
    total,
    abortedReason,
    failedIds,
    estimateBytes,
    freeBytes,
  };
}

export async function deleteAllHymnsFromCache(): Promise<number> {
  return clearAllHymnCache();
}
