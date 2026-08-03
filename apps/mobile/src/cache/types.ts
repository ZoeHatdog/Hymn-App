import type { Hymn } from "@hymn-app/shared-types";

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
