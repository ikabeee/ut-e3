export type HealthStatus = "ok" | "low-disk";

/** Below this, SQLite starts failing with SQLITE_FULL: the WAL alone grows to 4 MB between checkpoints (RNF-17). */
export const MIN_DATABASE_FREE_BYTES = 64 * 1024 * 1024;

/** `freeBytes` is null when the volume cannot be read; then only the answer of the server counts. */
export function getHealthStatus(freeBytes: number | null): HealthStatus {
  if (freeBytes !== null && freeBytes < MIN_DATABASE_FREE_BYTES) return "low-disk";

  return "ok";
}
