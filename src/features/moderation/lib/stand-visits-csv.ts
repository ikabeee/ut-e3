import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import type { StandVisit } from "@features/moderation/lib/types";

const COPY = MODERATION_COPY.byStand;

const HEADER = [
  COPY.columns.gamertag,
  COPY.columns.time,
  COPY.columns.recordedBy,
  "Juego",
  "Stand",
  "Arte",
  COPY.columns.status,
];

/**
 * The visits of a stand as CSV for a spreadsheet. It has the gamertag, never the PIN or the email. A cell that starts
 * like a formula ("=", "+", "-", "@") gets a quote in front so the spreadsheet shows it instead of running it.
 */
export function buildStandVisitsCsv(visits: readonly StandVisit[]): string {
  const rows = visits.map((visit) => [
    visit.gamertag,
    visit.at,
    visit.recordedBy ?? "",
    visit.ratings?.game ?? "",
    visit.ratings?.stand ?? "",
    visit.ratings?.art ?? "",
    COPY.status[visit.status],
  ]);

  return [HEADER, ...rows].map((row) => row.map(toCell).join(",")).join("\r\n") + "\r\n";
}

function toCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
