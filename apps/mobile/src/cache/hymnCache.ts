import type { CachedHymnRecord } from "./types";
import type { Hymn, HymnSummary } from "@hymn-app/shared-types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Directory, File, Paths } from "expo-file-system";

function hymnKey(id: string): string {
  return `hymn-${id}`;
}

export async function saveHymnToCache(hymn: Hymn): Promise<CachedHymnRecord> {
  const existing = await readHymnFromCache(hymn.id);

  if (existing && !isHymnCacheStale(existing, hymn)) {
    return existing;
  }

  // Stale or missing: wipe metadata + image folder, then redownload
  if (existing) {
    await clearHymnCache(hymn.id);
  }

  const localImagePaths = await downloadHymnImages(hymn);

  const cachedHymn: CachedHymnRecord = {
    hymn,
    cachedAt: Date.now(),
    localImagePaths,
  };

  await AsyncStorage.setItem(hymnKey(hymn.id), JSON.stringify(cachedHymn));
  return cachedHymn;
}

export async function readHymnFromCache(
  id: string,
): Promise<CachedHymnRecord | null> {
  const raw = await AsyncStorage.getItem(hymnKey(id));
  if (!raw) return null;
  return JSON.parse(raw) as CachedHymnRecord;
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
  const dir = new Directory(Paths.document, "hymns", id);
  if (dir.exists) {
    dir.delete();
  }
}

/** Remove all cached hymn metadata and downloaded images. */
export async function clearAllHymnCache(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const hymnKeys = keys.filter((key) => key.startsWith("hymn-"));

  if (hymnKeys.length > 0) {
    await AsyncStorage.multiRemove(hymnKeys);
  }

  const hymnsDir = new Directory(Paths.document, "hymns");
  if (hymnsDir.exists) {
    hymnsDir.delete();
  }

  return hymnKeys.length;
}

export function isHymnCacheStale(
  cache: CachedHymnRecord,
  fresh: Hymn,
): boolean {
  return cache.hymn.updatedAt !== fresh.updatedAt;
}

async function downloadHymnImages(hymn: Hymn): Promise<string[]> {
  const dir = new Directory(Paths.document, "hymns", hymn.id);
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
