import type { CachedHymnRecord } from "./types";
import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { CacheError, toCacheError } from "./errors";

function hymnKey(id: string): string {
  return `hymn-${id}`;
}

function hymnsRoot(): Directory {
  return new Directory(Paths.document, "hymns");
}

function finalDir(id: string): Directory {
  return new Directory(Paths.document, "hymns", id);
}

function tempDir(id: string): Directory {
  return new Directory(Paths.document, "hymns", `${id}.tmp`);
}

function oldDir(id: string): Directory {
  return new Directory(Paths.document, "hymns", `${id}.old`);
}

function ensureHymnsRoot(): void {
  const root = hymnsRoot();
  if (!root.exists) {
    root.create({ intermediates: true, idempotent: true });
  }
}

function deleteDirIfExists(dir: Directory): void {
  if (dir.exists) {
    dir.delete();
  }
}

/** Remove leftover temp/old dirs for a hymn without touching a good final cache. */
export function clearIncompleteHymnDirs(id: string): void {
  deleteDirIfExists(tempDir(id));
  deleteDirIfExists(oldDir(id));
}

function localPathsForDir(dir: Directory, pageCount: number): string[] {
  const paths: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    paths.push(new File(dir, `page-${i}.jpg`).uri);
  }
  return paths;
}

async function downloadHymnImagesToDir(
  hymn: Hymn,
  dir: Directory,
): Promise<string[]> {
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }

  const localPaths: string[] = [];

  for (let i = 0; i < hymn.imageUrls.length; i++) {
    const url = hymn.imageUrls[i];
    const dest = new File(dir, `page-${i}.jpg`);
    if (!dest.exists) {
      await File.downloadFileAsync(url, dest, { idempotent: true });
    }
    localPaths.push(dest.uri);
  }

  return localPaths;
}

/**
 * Promote temp download into the final hymn folder.
 * Keeps the previous final folder until the new one is in place.
 */
function promoteTempDir(id: string): Directory {
  const temp = tempDir(id);
  const final = finalDir(id);
  const old = oldDir(id);

  deleteDirIfExists(old);

  try {
    if (final.exists) {
      final.rename(`${id}.old`);
    }

    if (!temp.exists) {
      throw new CacheError("unknown", "Temporary hymn cache folder is missing.");
    }

    temp.rename(id);
  } catch (err) {
    const restored = oldDir(id);
    const currentFinal = finalDir(id);
    if (restored.exists && !currentFinal.exists) {
      try {
        restored.rename(id);
      } catch {
        // Best-effort restore
      }
    }
    throw err;
  }

  deleteDirIfExists(oldDir(id));
  return finalDir(id);
}

export async function saveHymnToCache(hymn: Hymn): Promise<CachedHymnRecord> {
  const existing = await readHymnFromCache(hymn.id);

  if (existing && !isHymnCacheStale(existing, hymn)) {
    return existing;
  }

  ensureHymnsRoot();
  clearIncompleteHymnDirs(hymn.id);

  const temp = tempDir(hymn.id);

  try {
    // Lyrics-only hymns still get a temp folder so promote is consistent.
    if (!temp.exists) {
      temp.create({ intermediates: true, idempotent: true });
    }

    await downloadHymnImagesToDir(hymn, temp);
    const promoted = promoteTempDir(hymn.id);
    const localImagePaths = localPathsForDir(promoted, hymn.imageUrls.length);

    const cachedHymn: CachedHymnRecord = {
      hymn,
      cachedAt: Date.now(),
      localImagePaths,
    };

    try {
      await AsyncStorage.setItem(hymnKey(hymn.id), JSON.stringify(cachedHymn));
    } catch (err) {
      throw new CacheError(
        "storage",
        err instanceof Error ? err.message : "Failed to write hymn cache metadata.",
        { cause: err },
      );
    }

    return cachedHymn;
  } catch (err) {
    clearIncompleteHymnDirs(hymn.id);
    throw toCacheError(err);
  }
}

export async function readHymnFromCache(
  id: string,
): Promise<CachedHymnRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(hymnKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as CachedHymnRecord;
  } catch {
    return null;
  }
}

export async function readCachedHymnSummaries(
  ids: string[],
): Promise<HymnSummary[]> {
  const summaries: HymnSummary[] = [];

  for (const id of ids) {
    const record = await readHymnFromCache(id);
    if (!record) continue;
    summaries.push({
      id: record.hymn.id,
      title: record.hymn.title,
      author: record.hymn.author,
    });
  }

  return summaries;
}

export async function isHymnCached(id: string): Promise<boolean> {
  return (await readHymnFromCache(id)) !== null;
}

export async function clearHymnCache(id: string): Promise<void> {
  await AsyncStorage.removeItem(hymnKey(id));
  deleteDirIfExists(finalDir(id));
  clearIncompleteHymnDirs(id);
}

/** Remove all cached hymn metadata and downloaded images. */
export async function clearAllHymnCache(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const hymnKeys = keys.filter((key) => key.startsWith("hymn-"));

  if (hymnKeys.length > 0) {
    await AsyncStorage.multiRemove(hymnKeys);
  }

  deleteDirIfExists(hymnsRoot());

  return hymnKeys.length;
}

export function isHymnCacheStale(
  cache: CachedHymnRecord,
  fresh: Hymn,
): boolean {
  return cache.hymn.updatedAt !== fresh.updatedAt;
}
