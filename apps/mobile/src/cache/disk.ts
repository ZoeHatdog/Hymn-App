import { getFreeDiskStorageAsync } from "expo-file-system/legacy";
import { CacheError } from "./errors";

/** Rough per-hymn estimate (metadata + typical sheet images). */
export const AVG_BYTES_PER_HYMN = 500_000;

/** Keep headroom so the device does not fill completely. */
export const SAFETY_BUFFER_BYTES = 50 * 1024 * 1024;

/** Recheck free space every N hymns during bulk download. */
export const DISK_RECHECK_EVERY = 5;

export async function getFreeDiskBytes(): Promise<number> {
  return getFreeDiskStorageAsync();
}

export function estimateCacheBytes(hymnCount: number): number {
  return Math.max(0, hymnCount) * AVG_BYTES_PER_HYMN + SAFETY_BUFFER_BYTES;
}

export function hasEnoughDiskSpace(
  freeBytes: number,
  hymnCount: number,
): boolean {
  return freeBytes >= estimateCacheBytes(hymnCount);
}

export function assertEnoughDiskSpace(
  freeBytes: number,
  hymnCount: number,
): void {
  const estimateBytes = estimateCacheBytes(hymnCount);
  if (freeBytes < estimateBytes) {
    throw new CacheError(
      "storage",
      `Not enough storage. Need about ${formatBytes(estimateBytes)}, but only ${formatBytes(freeBytes)} is free.`,
    );
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}
