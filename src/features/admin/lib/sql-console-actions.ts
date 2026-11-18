"use server";

import { updateTag } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  describeSqlError,
  MAX_SQL_ROWS,
  previewSqlWrite,
  runSqlRead,
  runSqlWrite,
} from "@features/admin/lib/server/sql-console";
import { parseSqlStatement, type SqlStatementKind } from "@features/admin/lib/sql-statement";
import type { SqlConsoleState } from "@features/admin/lib/types";
import { EVENT_SETTINGS_CACHE_TAG } from "@features/event-settings/lib/server/event-settings-queries";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { SCHEDULE_CACHE_TAG } from "@features/schedule/lib/server/schedule-queries";
import { SPONSORS_CACHE_TAG } from "@features/sponsors/lib/server/sponsors-queries";
import { VISITOR_PINS_CACHE_TAG } from "@features/visitors/lib/visitor-cache-tags";
import { readFormText } from "@shared/lib/form-data";

const COPY = ADMIN_COPY.sql;

// An arbitrary write can touch any table, so every cache tag of the public pages is refreshed.
const PUBLIC_CACHE_TAGS = [
  EVENT_SETTINGS_CACHE_TAG,
  GAMES_CACHE_TAG,
  SCHEDULE_CACHE_TAG,
  SPONSORS_CACHE_TAG,
  VISITOR_PINS_CACHE_TAG,
];

interface SqlRequest {
  actorId: string;
  statement: string;
  /** What was typed in the confirmation field; null when the form has no such field (the first step). */
  confirmation: string | null;
}

// A Server Action is a public endpoint: the session is checked first, then the statement, and the confirmation word
// travels in a second form that repeats the reviewed statement, which is validated again here.
export async function runSqlAction(_previous: SqlConsoleState | null, form: FormData): Promise<SqlConsoleState> {
  const actor = await requireSysadmin();
  const parsed = parseSqlStatement(readFormText(form, "sql"));

  if (!parsed.isValid) return fail(parsed.message);

  const confirmation = form instanceof FormData && form.has("confirmation") ? readFormText(form, "confirmation") : null;

  try {
    return await execute(parsed.kind, { actorId: actor.id, statement: parsed.text, confirmation });
  } catch (cause) {
    return fail(describeSqlError(cause));
  }
}

async function execute(kind: SqlStatementKind, request: SqlRequest): Promise<SqlConsoleState> {
  if (kind === "read") return read(request);

  return request.confirmation === null ? review(request) : write(request);
}

async function read({ actorId, statement }: SqlRequest): Promise<SqlConsoleState> {
  const result = await runSqlRead(actorId, statement);
  const message = result.isTruncated ? COPY.truncated(MAX_SQL_ROWS) : COPY.rows(result.rows.length);

  return { status: "read", message, result };
}

async function review({ actorId, statement }: SqlRequest): Promise<SqlConsoleState> {
  const affectedRows = await previewSqlWrite(actorId, statement);

  return { status: "review", message: COPY.review(affectedRows), statement, affectedRows };
}

async function write({ actorId, statement, confirmation }: SqlRequest): Promise<SqlConsoleState> {
  if (confirmation !== COPY.confirmationWord) return fail(COPY.errors.confirmation);

  const affectedRows = await runSqlWrite(actorId, statement);

  PUBLIC_CACHE_TAGS.forEach((tag) => updateTag(tag));

  return { status: "done", message: COPY.done(affectedRows), affectedRows };
}

function fail(message: string): SqlConsoleState {
  return { status: "error", message };
}
