import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { readFormText } from "@shared/lib/form-data";

export type ParseResult<Value> = { ok: true; value: Value } | { ok: false; message: string };

// A little above what registration accepts (80, 20 and 254), so a long value is refused without reaching the database.
const MAX_QUERY = 120;

const MAX_VISITOR_ID = 64;

const ERRORS = SUPPORT_COPY.recovery.errors;

/** What the visitor remembers: an email, a gamertag or the full name. */
export function parseSearchInput(form: FormData): ParseResult<string> {
  const query = readFormText(form, "query").trim().replaceAll(/\s+/g, " ");

  if (!query) return { ok: false, message: ERRORS.queryRequired };

  if (query.length > MAX_QUERY) return { ok: false, message: ERRORS.fieldTooLong };

  return { ok: true, value: query };
}

/** The passport the agent chose in the list of the search. */
export function parseRecoveryTarget(form: FormData): ParseResult<string> {
  const visitorId = readFormText(form, "visitorId").trim();

  if (!visitorId || visitorId.length > MAX_VISITOR_ID) return { ok: false, message: ERRORS.targetRequired };

  return { ok: true, value: visitorId };
}

/** The full name is compared without regard to case or repeated spaces. */
export function normalizeFullName(fullName: string): string {
  return fullName.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("es-MX");
}
