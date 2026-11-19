import type { AdminVisitorRow } from "@features/visitors/lib/types";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";
import { buildCsv } from "@shared/lib/csv";

const COPY = VISITORS_ADMIN_COPY;

/** The registrations as CSV. It has the email the sysadmin sees, never the PIN; `buildCsv` neutralizes formulas. */
export function buildVisitorsCsv(rows: readonly AdminVisitorRow[]): string {
  const lines = rows.map((row) => [
    row.gamertag,
    row.fullName,
    row.email,
    row.createdAt,
    row.visitCount,
    row.activeTickets,
    row.tournamentStatus ?? "",
    row.isExcluded ? COPY.csv.yes : COPY.csv.no,
  ]);

  return buildCsv([COPY.csv.columns, ...lines]);
}
