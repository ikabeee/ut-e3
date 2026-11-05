import "server-only";
import { statfs } from "node:fs/promises";
import path from "node:path";

/**
 * Free bytes for an unprivileged process on the volume that holds the SQLite file of `databaseUrl` ("file:<path>"), or
 * null when it cannot be read. It only asks the file system, so it never waits for a write lock of the database.
 */
export async function getDatabaseFreeBytes(databaseUrl = process.env.DATABASE_URL): Promise<number | null> {
  const file = databaseUrl?.trim().replace(/^file:/, "");

  if (!file) return null;

  try {
    const stats = await statfs(path.dirname(path.resolve(file)));

    return stats.bavail * stats.bsize;
  } catch {
    return null;
  }
}
