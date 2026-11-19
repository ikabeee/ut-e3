import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import type { StandVisit } from "@features/moderation/lib/types";
import { buildCsv } from "@shared/lib/csv";

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
 * The visits of a stand as CSV for a spreadsheet. It has the gamertag, never the PIN or the email; `buildCsv` keeps a
 * cell that starts like a formula from running.
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

  return buildCsv([HEADER, ...rows]);
}
