import "server-only";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { backup } from "node:sqlite";
import { getPrisma } from "@shared/lib/server/prisma";
import { withReadOnlyDatabase } from "@shared/lib/server/sqlite-file";

export interface QuickCheckResult {
  ok: boolean;
  /** What PRAGMA quick_check answered: the single row "ok" when healthy, one line per problem otherwise. */
  messages: string[];
}

export interface CheckpointResult {
  /** True when a reader or writer kept SQLite from truncating the whole WAL. */
  isBusy: boolean;
  walFrames: number;
  checkpointedFrames: number;
}

export interface BackupFile {
  directory: string;
  file: string;
  bytes: number;
  /** Deletes the temporary folder with the copy; safe to call more than once. */
  cleanup: () => Promise<void>;
}

export const BACKUP_DIRECTORY_PREFIX = "ut-e3-backup-";

const MAX_QUICK_CHECK_MESSAGES = 10;

/** PRAGMA quick_check on its own read-only connection. It is synchronous: the server waits while it runs. */
export async function runQuickCheck(): Promise<QuickCheckResult> {
  return withReadOnlyDatabase((database) => {
    const rows = database.prepare("PRAGMA quick_check").all();
    const messages = rows.slice(0, MAX_QUICK_CHECK_MESSAGES).map((row) => String(Object.values(row)[0]));

    return { ok: messages.length === 1 && messages[0] === "ok", messages };
  });
}

/** PRAGMA wal_checkpoint(TRUNCATE): moves the WAL into the database file and empties it. */
export async function runCheckpoint(): Promise<CheckpointResult> {
  const [row] = await getPrisma().$queryRawUnsafe<
    { busy: number | bigint; log: number | bigint; checkpointed: number | bigint }[]
  >("PRAGMA wal_checkpoint(TRUNCATE)");

  return { isBusy: Number(row.busy) !== 0, walFrames: Number(row.log), checkpointedFrames: Number(row.checkpointed) };
}

/**
 * A consistent copy of the live database made with the online backup API of SQLite, so the app keeps writing while it
 * runs. It lives in a private (0700) temporary folder that the caller removes with `cleanup` once it has been sent: the
 * copy holds every personal datum of the event.
 */
export async function createBackup(): Promise<BackupFile> {
  const directory = await mkdtemp(path.join(tmpdir(), BACKUP_DIRECTORY_PREFIX));
  const file = path.join(directory, "backup.db");

  try {
    await withReadOnlyDatabase((database) => backup(database, file));

    return {
      directory,
      file,
      bytes: (await stat(file)).size,
      cleanup: () => rm(directory, { recursive: true, force: true }),
    };
  } catch (cause) {
    await rm(directory, { recursive: true, force: true });

    throw cause;
  }
}
