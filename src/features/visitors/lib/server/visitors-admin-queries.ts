import "server-only";

import { VISITORS_PAGE_SIZE } from "@features/visitors/lib/visitors-admin";
import type {
  AdminVisitorPage,
  AdminVisitorRow,
  DailyRegistrations,
  VisitorListParams,
} from "@features/visitors/lib/types";
import { VALID_CHECK_IN_WHERE } from "@features/visitors/lib/server/milestone-tickets";
import { Prisma } from "@generated/prisma/client";
import { formatCancunDay } from "@shared/lib/date-time";
import { getPrisma } from "@shared/lib/server/prisma";

const EXPORT_CHUNK_SIZE = 500;

// Never selects the PIN columns: what leaves this file cannot carry them.
const ROW_SELECT = {
  id: true,
  gamertag: true,
  fullName: true,
  email: true,
  createdAt: true,
  excludedAt: true,
  tournamentEntry: { select: { status: true } },
  _count: {
    select: {
      checkIns: { where: VALID_CHECK_IN_WHERE },
      raffleTickets: { where: { status: "active" } },
    },
  },
} satisfies Prisma.VisitorSelect;

type VisitorRecord = Prisma.VisitorGetPayload<{ select: typeof ROW_SELECT }>;

/** One page of the registrations that match the search (gamertag, name or email), newest or oldest first. */
export async function listAdminVisitors(params: VisitorListParams): Promise<AdminVisitorPage> {
  const ids = await findMatchingIds(params);
  const start = (params.page - 1) * VISITORS_PAGE_SIZE;

  return {
    rows: await readRows(ids.slice(start, start + VISITORS_PAGE_SIZE)),
    total: ids.length,
    page: params.page,
    pageCount: Math.ceil(ids.length / VISITORS_PAGE_SIZE),
  };
}

/** Every registration that matches the search, for the CSV: the page does not apply. */
export async function listAdminVisitorsForExport(params: VisitorListParams): Promise<AdminVisitorRow[]> {
  const ids = await findMatchingIds(params);
  const rows: AdminVisitorRow[] = [];

  for (let start = 0; start < ids.length; start += EXPORT_CHUNK_SIZE) {
    rows.push(...(await readRows(ids.slice(start, start + EXPORT_CHUNK_SIZE))));
  }

  return rows;
}

/** Registrations per calendar day of Cancun, oldest day first; it counts all of them, whatever the search. */
export async function getRegistrationsPerDay(): Promise<DailyRegistrations[]> {
  const visitors = await getPrisma().visitor.findMany({ select: { createdAt: true } });
  const counts = new Map<string, number>();

  for (const { createdAt } of visitors) {
    const day = formatCancunDay(createdAt);

    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return [...counts.entries()].map(([day, count]) => ({ day, count })).toSorted((a, b) => a.day.localeCompare(b.day));
}

// The ids in the order of the list. It compares with instr() because LIKE, which Prisma's `contains` uses, would take
// a "%" or "_" typed in the search as a wildcard.
async function findMatchingIds({ query, sort }: VisitorListParams): Promise<string[]> {
  const direction = sort === "oldest" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  const rows = await getPrisma().$queryRaw<{ id: string }[]>`
    SELECT id FROM visitors
    WHERE ${query} = ''
      OR instr(lower(gamertag), lower(${query})) > 0
      OR instr(lower(full_name), lower(${query})) > 0
      OR instr(lower(email), lower(${query})) > 0
    ORDER BY created_at ${direction}, id ${direction}`;

  return rows.map((row) => row.id);
}

async function readRows(ids: string[]): Promise<AdminVisitorRow[]> {
  const records = await getPrisma().visitor.findMany({ where: { id: { in: ids } }, select: ROW_SELECT });
  const byId = new Map(records.map((record) => [record.id, record]));

  return ids.flatMap((id) => {
    const record = byId.get(id);

    return record ? [toRow(record)] : [];
  });
}

function toRow(record: VisitorRecord): AdminVisitorRow {
  return {
    id: record.id,
    gamertag: record.gamertag,
    fullName: record.fullName,
    email: record.email,
    createdAt: record.createdAt.toISOString(),
    visitCount: record._count.checkIns,
    activeTickets: record._count.raffleTickets,
    tournamentStatus: record.tournamentEntry?.status ?? null,
    isExcluded: record.excludedAt !== null,
  };
}
