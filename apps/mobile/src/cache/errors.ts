export type CacheErrorReason = "network" | "storage" | "unknown";

export class CacheError extends Error {
  readonly reason: CacheErrorReason;

  constructor(reason: CacheErrorReason, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "CacheError";
    this.reason = reason;
    if (options?.cause !== undefined) {
      // Attach for debugging without relying on ES2022 Error cause support.
      (this as CacheError & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function isCacheError(err: unknown): err is CacheError {
  return err instanceof CacheError;
}

export function toCacheError(err: unknown): CacheError {
  if (isCacheError(err)) return err;

  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (
    lower.includes("enospc") ||
    lower.includes("no space") ||
    lower.includes("not enough space") ||
    lower.includes("disk full") ||
    lower.includes("storage full") ||
    lower.includes("quota") ||
    lower.includes("out of space")
  ) {
    return new CacheError("storage", message, { cause: err });
  }

  if (
    lower.includes("network") ||
    lower.includes("timed out") ||
    lower.includes("timeout") ||
    lower.includes("unable to connect") ||
    lower.includes("offline") ||
    lower.includes("failed to download") ||
    lower.includes("abort")
  ) {
    return new CacheError("network", message, { cause: err });
  }

  return new CacheError("unknown", message, { cause: err });
}
