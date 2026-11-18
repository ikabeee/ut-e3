import "server-only";
import path from "node:path";
import { DatabaseSync, type SQLOutputValue } from "node:sqlite";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { SqlCell, SqlReadResult } from "@features/admin/lib/types";
import { recordAudit } from "@shared/lib/server/audit-log";
import { getPrisma } from "@shared/lib/server/prisma";

const COPY = ADMIN_COPY.sql;

export const MAX_SQL_ROWS = 500;

const BUSY_TIMEOUT_MS = 5000;

const MAX_ERROR_DETAIL = 300;

const AUDIT_ENTITY = { entityType: "sql_console", entityId: "sql" };

// Prisma wraps what SQLite said: "Raw query failed. Code: `1`. Message: `no such table: x`".
const PRISMA_RAW_MESSAGE = /Message: `([^`]*)`/;

/**
 * Runs one read in its own connection opened read-only, so SQLite itself refuses anything that writes, and records the
 * statement (never the rows) in the audit log first, so a read that takes the server down is in the log too.
 * better-sqlite3 and node:sqlite are synchronous: a slow query blocks the whole process until it ends, and nothing can
 * interrupt it from the same thread. The row cap stops the iteration early, which is all the guard there is.
 */
export async function runSqlRead(actorId: string, statement: string): Promise<SqlReadResult> {
  await auditStatement(actorId, "admin.sql.read", { statement });

  return withReadOnlyDatabase((database) => readRows(database, statement));
}

/**
 * How many rows the write would change, counted inside a transaction that is rolled back: nothing is kept. The review
 * is recorded afterwards in a transaction of its own, so the entry is not rolled back with the dry run.
 */
export async function previewSqlWrite(actorId: string, statement: string): Promise<number> {
  const affectedRows = await countAffectedRows(statement);

  await auditStatement(actorId, "admin.sql.review", { statement });

  return affectedRows;
}

/** The write and its audit entry in one transaction (RNF-11): if either fails, neither stays. */
export async function runSqlWrite(actorId: string, statement: string): Promise<number> {
  return getPrisma().$transaction(async (transaction) => {
    const changes = await transaction.$executeRawUnsafe(statement);

    await recordAudit(transaction, {
      actorId,
      action: "admin.sql.write",
      ...AUDIT_ENTITY,
      detail: { statement, changes },
    });

    return changes;
  });
}

/** What the sysadmin sees of a failure: SQLite's own message, short, and never a stack or a path. */
export function describeSqlError(cause: unknown): string {
  const detail = extractSqliteDetail(cause);

  return detail ? COPY.errors.sqlite(detail.slice(0, MAX_ERROR_DETAIL)) : COPY.errors.unknown;
}

class PreviewRollback extends Error {}

async function countAffectedRows(statement: string): Promise<number> {
  let affectedRows = 0;

  try {
    await getPrisma().$transaction(async (transaction) => {
      affectedRows = await transaction.$executeRawUnsafe(statement);

      throw new PreviewRollback();
    });
  } catch (cause) {
    if (!(cause instanceof PreviewRollback)) throw cause;
  }

  return affectedRows;
}

async function auditStatement(actorId: string, action: string, detail: { statement: string }): Promise<void> {
  await getPrisma().$transaction((transaction) =>
    recordAudit(transaction, { actorId, action, ...AUDIT_ENTITY, detail }),
  );
}

function withReadOnlyDatabase<Result>(work: (database: DatabaseSync) => Result): Result {
  const database = new DatabaseSync(getDatabasePath(), { readOnly: true, timeout: BUSY_TIMEOUT_MS });

  try {
    return work(database);
  } finally {
    database.close();
  }
}

// DATABASE_URL is "file:<path>" (prisma.ts checks it); a relative path is relative to the working directory.
function getDatabasePath(): string {
  const file = (process.env.DATABASE_URL ?? "")
    .trim()
    .replace(/^file:/, "")
    .split("?")[0];

  return path.resolve(file);
}

function readRows(database: DatabaseSync, text: string): SqlReadResult {
  const statement = database.prepare(text);

  statement.setReadBigInts(true);
  statement.setReturnArrays(true);

  const rows: SqlCell[][] = [];

  for (const row of statement.iterate()) {
    if (rows.length === MAX_SQL_ROWS) return buildResult(statement.columns(), rows, true);

    rows.push(toCells(row));
  }

  return buildResult(statement.columns(), rows, false);
}

function buildResult(columns: readonly { name: string }[], rows: SqlCell[][], isTruncated: boolean): SqlReadResult {
  return { columns: columns.map((column) => column.name), rows, isTruncated };
}

// With setReturnArrays the row is an array, which Object.values returns as it is.
function toCells(row: Record<string, SQLOutputValue>): SqlCell[] {
  return Object.values(row).map(toCell);
}

function toCell(value: SQLOutputValue): SqlCell {
  if (value === null) return { kind: "null", text: COPY.nullValue };

  if (value instanceof Uint8Array) return { kind: "blob", text: COPY.blobValue(value.byteLength) };

  return { kind: "value", text: String(value) };
}

function extractSqliteDetail(cause: unknown): string | null {
  if (!isErrorLike(cause)) return null;

  const fromPrisma = PRISMA_RAW_MESSAGE.exec(cause.message);

  if (fromPrisma) return fromPrisma[1];

  return cause.code === "ERR_SQLITE_ERROR" ? cause.message : null;
}

// Not `instanceof Error`: errors thrown by node:sqlite come from another realm under Jest.
function isErrorLike(cause: unknown): cause is { message: string; code?: unknown } {
  return typeof cause === "object" && cause !== null && "message" in cause && typeof cause.message === "string";
}
