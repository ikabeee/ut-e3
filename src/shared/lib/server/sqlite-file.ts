import "server-only";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const BUSY_TIMEOUT_MS = 5000;

/** Opens the database file in its own connection, read-only, for the time of `work` (which may be asynchronous). */
export async function withReadOnlyDatabase<Result>(
  work: (database: DatabaseSync) => Result | Promise<Result>,
): Promise<Result> {
  const database = new DatabaseSync(getDatabasePath(), { readOnly: true, timeout: BUSY_TIMEOUT_MS });

  try {
    return await work(database);
  } finally {
    database.close();
  }
}

// DATABASE_URL is "file:<path>" (prisma.ts checks it); a relative path is relative to the working directory.
export function getDatabasePath(): string {
  const file = (process.env.DATABASE_URL ?? "")
    .trim()
    .replace(/^file:/, "")
    .split("?")[0];

  return path.resolve(file);
}
