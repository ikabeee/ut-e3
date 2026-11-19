import "server-only";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";
import type { ServerLogLevel, ServerLogSource } from "@shared/lib/server-log-types";

/** What an event adds to its message; it must be JSON, which is what the column stores. */
export type ServerLogDetails = Prisma.InputJsonObject;

const MAX_MESSAGE_LENGTH = 2000;

const MAX_DETAILS_LENGTH = 8000;

const TRUNCATED_DETAILS_LENGTH = 2000;

const REDACTED = "[redacted]";

const EMAIL_ADDRESS = /\b([\w.+-])[\w.+-]*@([\w-]+(?:\.[\w-]+)+)/g;

const MASKED_EMAIL = "$1***@$2";

// Applied in this order: the query of a URL goes first; then the secrets that name themselves, in text and as the key
// of a JSON object; the long path segments (the tokens of the links); the addresses; and the 6-digit login codes.
const REDACTIONS: [RegExp, string][] = [
  [/(\bhttps?:\/\/[^\s"'<>?#]*)[?#][^\s"'<>]*/gi, "$1?[redacted]"],
  [/\b(password|passwd|pwd|contraseña)(\s*[:=]\s*)["']?[^\s,;&"']+/gi, `$1$2${REDACTED}`],
  [/\b(authorization)(\s*[:=]\s*)(?:(?:Bearer|Basic)\s+)?[^\s,;&"']+/gi, `$1$2${REDACTED}`],
  [/\b(secret|token|api[-_]?key)(\s*[:=]\s*)["']?[^\s,;&"']+/gi, `$1$2${REDACTED}`],
  [/("[^"]*(?:password|passwd|secret|token)[^"]*"\s*:\s*)"[^"]*"/gi, `$1"${REDACTED}"`],
  [/("[^"]*(?:authorization|cookie|api[-_]?key)[^"]*"\s*:\s*)"[^"]*"/gi, `$1"${REDACTED}"`],
  [/("(?:code|pin|otp)"\s*:\s*)(?:"[^"]*"|\d+)/gi, `$1"${REDACTED}"`],
  [/\bBearer\s+[\w.~+/=-]+/gi, `Bearer ${REDACTED}`],
  [/(?<=\/)[\w-]{24,}(?=[/?\s"'<>)]|$)/g, REDACTED],
  [EMAIL_ADDRESS, MASKED_EMAIL],
  [/\b\d{6}\b/g, "[code]"],
];

let isWritingFallback = false;

/**
 * Writes one event to `server_logs` (S4) and never throws: it runs while something else is already failing. Call it as
 * `logServerEvent(level, source, message, details)`; `details` is optional. The message and the details are redacted
 * first (tokens, codes, passwords, addresses). When the database write fails the event goes to the console instead, so
 * it is not lost.
 */
export async function logServerEvent(
  level: ServerLogLevel,
  source: ServerLogSource,
  ...event: [message: string, details?: ServerLogDetails]
): Promise<void> {
  const [message, details = {}] = event;

  try {
    await getPrisma().serverLog.create({
      data: { level, source, message: redactMessage(message), details: redactDetails(details) },
    });
  } catch (cause) {
    writeFallback(level, redactMessage(message), cause);
  }
}

/** True while the fallback writes to the console, so the console capture does not log its own fallback again. */
export function isServerLogFallbackActive(): boolean {
  return isWritingFallback;
}

/** `juan@ut.mx` becomes `j***@ut.mx`: enough to tell recipients apart without storing the address. */
export function maskEmail(address: string): string {
  return address.replace(EMAIL_ADDRESS, MASKED_EMAIL);
}

function redactMessage(message: string): string {
  return redactSecrets(message).slice(0, MAX_MESSAGE_LENGTH);
}

// The details are redacted as JSON text, so every nesting level gets the same rules; a result that is too long, or
// that stopped being JSON, is kept as a cut piece of text.
function redactDetails(details: ServerLogDetails): Prisma.InputJsonObject {
  const text = redactSecrets(JSON.stringify(details));

  if (text.length > MAX_DETAILS_LENGTH) return { truncated: text.slice(0, TRUNCATED_DETAILS_LENGTH) };

  try {
    return JSON.parse(text);
  } catch {
    return { truncated: text.slice(0, TRUNCATED_DETAILS_LENGTH) };
  }
}

function writeFallback(level: ServerLogLevel, message: string, cause: unknown): void {
  const reason = cause instanceof Error ? redactSecrets(cause.message) : "Unknown error";
  const line = `${message} (server log not saved: ${reason})`;

  isWritingFallback = true;

  try {
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.info(line);
  } catch {
    // Nothing is left to try: the logger must not throw.
  } finally {
    isWritingFallback = false;
  }
}

/** Removes the obvious secrets of a text: tokens in URLs, passwords, codes of 6 digits. Addresses keep one letter. */
export function redactSecrets(text: string): string {
  return REDACTIONS.reduce((redacted, [pattern, replacement]) => redacted.replace(pattern, replacement), text);
}
