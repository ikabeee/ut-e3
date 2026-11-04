import "server-only";
import { getRafflePhase } from "@features/raffle/lib/raffle-rules";
import type {
  AdminWinner,
  LiveDraw,
  PendingDraw,
  RaffleAdminSnapshot,
  RaffleLiveSnapshot,
  RaffleWin,
  RaffleWinner,
} from "@features/raffle/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

export interface RaffleSchedule {
  startsAt: Date;
  closedAt: Date | null;
}

type RaffleReader = Prisma.TransactionClient;

const MISSING_SETTINGS = "Faltan los horarios del evento (event_settings). Corre npm run db:seed.";

/** What the drum on stage and the public section read (RF-49, RF-56): gamertags only, no names or emails. */
export async function getRaffleLiveSnapshot(now: Date): Promise<RaffleLiveSnapshot> {
  const [schedule, latest, winners, revision] = await Promise.all([
    getRaffleSchedule(),
    getLatestDraw(),
    listPublicRaffleWinners(),
    getRevision(),
  ]);

  return {
    phase: getRafflePhase(schedule, now),
    startsAt: schedule.startsAt.toISOString(),
    latest,
    winners,
    revision,
    serverNow: now.getTime(),
  };
}

/** What the panel of the raffle administrators reads. */
export async function getRaffleAdminSnapshot(now: Date): Promise<RaffleAdminSnapshot> {
  const [schedule, pending, winners, activeTickets, discardedCount, revision] = await Promise.all([
    getRaffleSchedule(),
    findPendingDraw(getPrisma()),
    listRaffleWinners(),
    getPrisma().raffleTicket.count({ where: { status: "active" } }),
    getPrisma().raffleDraw.count({ where: { outcome: "discarded" } }),
    getRevision(),
  ]);

  return {
    phase: getRafflePhase(schedule, now),
    startsAt: schedule.startsAt.toISOString(),
    closedAt: schedule.closedAt?.toISOString() ?? null,
    activeTickets,
    pending,
    winners,
    discardedCount,
    revision,
    serverNow: now.getTime(),
  };
}

/** The hour and the closing of the raffle live in the single row of `event_settings`. */
export async function getRaffleSchedule(reader: RaffleReader = getPrisma()): Promise<RaffleSchedule> {
  const settings = await reader.eventSettings.findUnique({
    where: { id: 1 },
    select: { raffleStartsAt: true, raffleClosedAt: true },
  });

  if (!settings) throw new Error(MISSING_SETTINGS);

  return { startsAt: settings.raffleStartsAt, closedAt: settings.raffleClosedAt };
}

/** Everything a view of a draw needs: the gamertag of the ticket and the names of the administrators. */
export const DRAW_SELECT = {
  id: true,
  ticketNumber: true,
  outcome: true,
  drawnAt: true,
  decidedAt: true,
  prizeName: true,
  drawnById: true,
  drawnBy: { select: { name: true } },
  prizeBy: { select: { name: true } },
  ticket: { select: { visitor: { select: { gamertag: true } } } },
} satisfies Prisma.RaffleDrawSelect;

type DrawRow = Prisma.RaffleDrawGetPayload<{ select: typeof DRAW_SELECT }>;

async function getLatestDraw(): Promise<LiveDraw | null> {
  const row = await getPrisma().raffleDraw.findFirst({ orderBy: { drawnAt: "desc" }, select: DRAW_SELECT });

  return row ? toLiveDraw(row) : null;
}

/** The winners of the public section: who registered each prize stays in the panel. */
export async function listPublicRaffleWinners(): Promise<RaffleWinner[]> {
  return (await listRaffleWinners()).map(toPublicWinner);
}

/** Confirmed winners in the order they won. */
export async function listRaffleWinners(): Promise<AdminWinner[]> {
  const rows = await getPrisma().raffleDraw.findMany({
    where: { outcome: "winner" },
    orderBy: { decidedAt: "asc" },
    select: DRAW_SELECT,
  });

  return rows.map(toAdminWinner);
}

/** The draw that blocks the next spin, if any (RF-51). */
export async function findPendingDraw(reader: RaffleReader): Promise<PendingDraw | null> {
  const row = await reader.raffleDraw.findFirst({ where: { outcome: "pending" }, select: DRAW_SELECT });

  return row ? toPendingDraw(row) : null;
}

export async function findDrawByRequest(reader: RaffleReader, requestId: string): Promise<PendingDraw | null> {
  const row = await reader.raffleDraw.findUnique({ where: { requestId }, select: DRAW_SELECT });

  return row ? toPendingDraw(row) : null;
}

/** The win of a visitor for the passport (RF-25); a discarded ticket is not a win. */
export async function getVisitorRaffleWin(visitorId: string): Promise<RaffleWin | null> {
  const row = await getPrisma().raffleDraw.findFirst({
    where: { outcome: "winner", ticket: { visitorId } },
    select: { ticketNumber: true, decidedAt: true, prizeName: true },
  });

  if (!row?.decidedAt) return null;

  return { ticketNumber: row.ticketNumber, decidedAt: row.decidedAt.toISOString(), prizeName: row.prizeName };
}

// Every change adds one: a spin, a decision, a prize or the closing. Answers that arrive late have a lower number.
async function getRevision(): Promise<number> {
  const [draws, decided, prizes, closed] = await Promise.all([
    getPrisma().raffleDraw.count(),
    getPrisma().raffleDraw.count({ where: { outcome: { not: "pending" } } }),
    getPrisma().raffleDraw.count({ where: { prizeName: { not: null } } }),
    getPrisma().eventSettings.count({ where: { id: 1, raffleClosedAt: { not: null } } }),
  ]);

  return draws + decided + prizes + closed;
}

export function toPendingDraw(row: DrawRow): PendingDraw {
  return {
    id: row.id,
    ticketNumber: row.ticketNumber,
    gamertag: row.ticket.visitor.gamertag,
    drawnAt: row.drawnAt.toISOString(),
    drawnById: row.drawnById,
    drawnByName: row.drawnBy.name,
  };
}

function toLiveDraw(row: DrawRow): LiveDraw {
  return {
    id: row.id,
    ticketNumber: row.ticketNumber,
    gamertag: row.ticket.visitor.gamertag,
    outcome: toOutcome(row.outcome),
    drawnAt: row.drawnAt.toISOString(),
  };
}

function toAdminWinner(row: DrawRow): AdminWinner {
  return {
    drawId: row.id,
    ticketNumber: row.ticketNumber,
    gamertag: row.ticket.visitor.gamertag,
    decidedAt: (row.decidedAt ?? row.drawnAt).toISOString(),
    prizeName: row.prizeName,
    prizeByName: row.prizeBy?.name ?? null,
  };
}

function toPublicWinner(winner: AdminWinner): RaffleWinner {
  const { drawId, ticketNumber, gamertag, decidedAt, prizeName } = winner;

  return { drawId, ticketNumber, gamertag, decidedAt, prizeName };
}

// The CHECK of the migration only lets these three in.
function toOutcome(value: string): LiveDraw["outcome"] {
  return value === "winner" || value === "discarded" ? value : "pending";
}
