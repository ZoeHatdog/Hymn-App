import type { CachedHymnRecord } from "./types";
import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";
import { CacheError, toCacheError } from "./errors";

const LYRICS_FILENAME = "lyrics.txt";
const SUMMARY_INDEX_KEY = "hymn-summaries";

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

function lyricsFile(dir: Directory): File {
  return new File(dir, LYRICS_FILENAME);
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

function fileExistsAtUri(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

function writeLyricsToDir(dir: Directory, lyrics: string): void {
  const file = lyricsFile(dir);
  file.write(lyrics);
  if (!file.exists) {
    throw new CacheError("storage", "Failed to write hymn lyrics file.");
  }
}

async function readLyricsFromDir(dir: Directory): Promise<string | null> {
  const file = lyricsFile(dir);
  if (!file.exists) return null;
  try {
    return await file.text();
  } catch {
    return null;
  }
}

/** Strip lyrics so AsyncStorage only holds small metadata. */
function toStoredRecord(record: CachedHymnRecord): CachedHymnRecord {
  return {
    ...record,
    hymn: {
      ...record.hymn,
      lyrics: "",
    },
  };
}

/** True when metadata matches on-disk lyrics + images. */
export function isHymnCacheComplete(record: CachedHymnRecord): boolean {
  const dir = finalDir(record.hymn.id);
  if (!dir.exists) return false;

  const hasLyricsFile = lyricsFile(dir).exists;
  const hasLegacyLyrics = record.hymn.lyrics.length > 0;
  // New saves always write lyrics.txt (even when empty). Legacy caches may
  // still keep lyrics inline in AsyncStorage without a file.
  if (!hasLyricsFile && !hasLegacyLyrics) {
    return false;
  }

  const expected = record.hymn.imageUrls.length;
  if (expected === 0) return true;
  if (record.localImagePaths.length !== expected) return false;
  return record.localImagePaths.every(fileExistsAtUri);
}

/** Local image URIs that still exist on disk. */
export function existingLocalImagePaths(record: CachedHymnRecord): string[] {
  return record.localImagePaths.filter(fileExistsAtUri);
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
    if (!dest.exists) {
      throw new CacheError(
        "unknown",
        `Failed to download hymn image page ${i + 1}.`,
      );
    }
    localPaths.push(dest.uri);
  }

  return localPaths;
}

/**
 * Promote temp download into the final hymn folder.
 * Leaves `id.old` in place until metadata is written successfully.
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

  return finalDir(id);
}

function restoreOldAfterFailedMetadata(id: string): void {
  const final = finalDir(id);
  const old = oldDir(id);
  deleteDirIfExists(final);
  if (old.exists) {
    try {
      old.rename(id);
    } catch {
      // Best-effort restore
    }
  }
  deleteDirIfExists(tempDir(id));
}

export async function saveHymnToCache(hymn: Hymn): Promise<CachedHymnRecord> {
  const existing = await readHymnFromCache(hymn.id);

  if (
    existing &&
    !isHymnCacheStale(existing, hymn) &&
    isHymnCacheComplete(existing)
  ) {
    return existing;
  }

  ensureHymnsRoot();
  clearIncompleteHymnDirs(hymn.id);

  const temp = tempDir(hymn.id);
  let promoted = false;

  try {
    if (!temp.exists) {
      temp.create({ intermediates: true, idempotent: true });
    }

    writeLyricsToDir(temp, hymn.lyrics);

    const downloaded = await downloadHymnImagesToDir(hymn, temp);
    if (downloaded.length !== hymn.imageUrls.length) {
      throw new CacheError("unknown", "Incomplete hymn image download.");
    }

    const promotedDir = promoteTempDir(hymn.id);
    promoted = true;
    const localImagePaths = localPathsForDir(
      promotedDir,
      hymn.imageUrls.length,
    );

    if (
      hymn.imageUrls.length > 0 &&
      !localImagePaths.every(fileExistsAtUri)
    ) {
      throw new CacheError("unknown", "Hymn images missing after download.");
    }

    if (!lyricsFile(promotedDir).exists) {
      throw new CacheError("unknown", "Hymn lyrics file missing after save.");
    }

    const cachedHymn: CachedHymnRecord = {
      hymn,
      cachedAt: Date.now(),
      localImagePaths,
    };

    try {
      await AsyncStorage.setItem(
        hymnKey(hymn.id),
        JSON.stringify(toStoredRecord(cachedHymn)),
      );
    } catch (err) {
      throw new CacheError(
        "storage",
        err instanceof Error
          ? err.message
          : "Failed to write hymn cache metadata.",
        { cause: err },
      );
    }

    deleteDirIfExists(oldDir(hymn.id));
    return cachedHymn;
  } catch (err) {
    if (promoted) {
      restoreOldAfterFailedMetadata(hymn.id);
    } else {
      clearIncompleteHymnDirs(hymn.id);
    }
    throw toCacheError(err);
  }
}

export async function readHymnFromCache(
  id: string,
): Promise<CachedHymnRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(hymnKey(id));
    if (!raw) return null;

    const stored = JSON.parse(raw) as CachedHymnRecord;
    const fromFile = await readLyricsFromDir(finalDir(id));
    const lyrics =
      fromFile !== null
        ? fromFile
        : typeof stored.hymn.lyrics === "string"
          ? stored.hymn.lyrics
          : "";

    return {
      ...stored,
      hymn: {
        ...stored.hymn,
        lyrics,
      },
    };
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
    if (!record || !isHymnCacheComplete(record)) continue;
    summaries.push({
      id: record.hymn.id,
      title: record.hymn.title,
      author: record.hymn.author,
      library: record.hymn.library,
      page: record.hymn.page,
    });
  }

  return summaries;
}

/** Persist the browse/search catalog index (best-effort). */
export async function saveHymnSummaryIndex(
  summaries: HymnSummary[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(SUMMARY_INDEX_KEY, JSON.stringify(summaries));
  } catch {
    // Best-effort; browse can still work online
  }
}

/** Read the cached catalog index for offline browse/search. */
export async function readHymnSummaryIndex(): Promise<HymnSummary[] | null> {
  try {
    const raw = await AsyncStorage.getItem(SUMMARY_INDEX_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as HymnSummary[];
  } catch {
    return null;
  }
}

export async function isHymnCached(id: string): Promise<boolean> {
  const record = await readHymnFromCache(id);
  return record !== null && isHymnCacheComplete(record);
}

export async function clearHymnCache(id: string): Promise<void> {
  await AsyncStorage.removeItem(hymnKey(id));
  deleteDirIfExists(finalDir(id));
  clearIncompleteHymnDirs(id);
}

/** Remove all cached hymn metadata and downloaded images. */
export async function clearAllHymnCache(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const hymnKeys = keys.filter(
    (key) => key.startsWith("hymn-") && key !== SUMMARY_INDEX_KEY,
  );

  const keysToRemove = [...hymnKeys];
  if (keys.includes(SUMMARY_INDEX_KEY)) {
    keysToRemove.push(SUMMARY_INDEX_KEY);
  }

  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
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
