import type { Hymn } from "@hymn-app/shared-types";

/**
 * In-memory / API-facing cache record (includes full lyrics).
 * AsyncStorage stores the same shape with `hymn.lyrics` cleared; lyrics live in
 * `hymns/<id>/lyrics.txt` on disk.
 */
export type CachedHymnRecord = {
  hymn: Hymn;
  cachedAt: number;
  localImagePaths: string[];
};

export type SaveAllHymnsResult = {
  saved: number;
  /** Already up to date — no re-download needed. */
  skipped: number;
  failed: number;
  total: number;
  abortedReason?: "storage" | "network";
  failedIds: string[];
  estimateBytes?: number;
  freeBytes?: number;
};
