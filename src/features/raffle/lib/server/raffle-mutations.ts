import "server-only";
import { randomInt as cryptoRandomInt } from "node:crypto";
import { buildWinnerEmail } from "@features/raffle/lib/raffle-email";
import type { DecisionOutcome, PrizeInput } from "@features/raffle/lib/raffle-input";
import { getRafflePhase, pickTicketIndex, type RandomInt } from "@features/raffle/lib/raffle-rules";
import {
  DRAW_SELECT,
  findDrawByRequest,
  findPendingDraw,
  getRaffleSchedule,
  toPendingDraw,
} from "@features/raffle/lib/server/raffle-queries";
import type { PendingDraw } from "@features/raffle/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isUniqueViolation } from "@shared/lib/server/database-errors";
import { enqueueEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";

export type SpinResult =
  | { status: "drawn"; draw: PendingDraw }
  | { status: "notStarted"; startsAt: Date }
  | { status: "closed" }
  | { status: "noTickets" }
  /** Another administrator has a ticket without a decision (RF-50). */
  | { status: "busy"; pending: PendingDraw }
  /** The same administrator has to decide its own ticket first (RF-51). */
  | { status: "undecided"; pending: PendingDraw };

export interface SpinRequest {
  actorId: string;
  /** One per press of "Girar": the same id twice returns the same draw (RNF-05, EC-08). */
  requestId: string;
  now: Date;
  randomInt?: RandomInt;
}

type Transaction = Prisma.TransactionClient;

/**
 * Spins the drum (RF-49): picks one active ticket with `crypto.randomInt` and takes every ticket of its visitor out of
 * the raffle, wins or not (RF-52, RN-05). SQLite runs one write at a time, and the partial unique index on `pending`
 * stops a second spin before the first is decided even when two requests arrive together (RF-50, RF-51).
 */
export async function spinRaffle(request: SpinRequest): Promise<SpinResult> {
  try {
    return await getPrisma().$transaction((transaction) => spinInTransaction(transaction, request));
  } catch (cause) {
    if (!isUniqueViolation(cause)) throw cause;

    return resolveSpinConflict(request);
  }
}

async function spinInTransaction(transaction: Transaction, request: SpinRequest): Promise<SpinResult> {
  const repeated = await findDrawByRequest(transaction, request.requestId);

  if (repeated) return { status: "drawn", draw: repeated };

  const blocked = await findSpinBlocker(transaction, request);

  if (blocked) return blocked;

  const tickets = await transaction.raffleTicket.findMany({
    where: { status: "active" },
    orderBy: { number: "asc" },
    select: { number: true, visitorId: true },
  });

  if (tickets.length === 0) return { status: "noTickets" };

  const index = pickTicketIndex(tickets.length, request.randomInt ?? cryptoRandomInt);
  const draw = await recordDraw(transaction, request, tickets[index]);

  await auditDraw(transaction, request.actorId, { draw, candidates: tickets.length, index });

  return { status: "drawn", draw };
}

async function findSpinBlocker(transaction: Transaction, { actorId, now }: SpinRequest): Promise<SpinResult | null> {
  const schedule = await getRaffleSchedule(transaction);
  const phase = getRafflePhase(schedule, now);

  if (phase === "upcoming") return { status: "notStarted", startsAt: schedule.startsAt };

  if (phase === "closed") return { status: "closed" };

  const pending = await findPendingDraw(transaction);

  if (!pending) return null;

  return pending.drawnById === actorId ? { status: "undecided", pending } : { status: "busy", pending };
}

interface DrawnTicket {
  number: number;
  visitorId: string;
}

async function recordDraw(transaction: Transaction, request: SpinRequest, ticket: DrawnTicket): Promise<PendingDraw> {
  const row = await transaction.raffleDraw.create({
    data: {
      ticketNumber: ticket.number,
      requestId: request.requestId,
      drawnById: request.actorId,
      drawnAt: request.now,
    },
    select: DRAW_SELECT,
  });

  await transaction.raffleTicket.updateMany({
    where: { visitorId: ticket.visitorId, status: "active" },
    data: { status: "drawn" },
  });

  return toPendingDraw(row);
}

interface DrawAudit {
  draw: PendingDraw;
  candidates: number;
  index: number;
}

async function auditDraw(transaction: Transaction, actorId: string, { draw, candidates, index }: DrawAudit) {
  await recordAudit(transaction, {
    actorId,
    action: "raffle_drawn",
    entityType: "raffle_draw",
    entityId: draw.id,
    detail: { ticketNumber: draw.ticketNumber, gamertag: draw.gamertag, candidates, index },
  });
}

// Two spins collided on a unique key: the same request (the first one already answered it) or another pending draw.
async function resolveSpinConflict(request: SpinRequest): Promise<SpinResult> {
  const repeated = await findDrawByRequest(getPrisma(), request.requestId);

  if (repeated) return { status: "drawn", draw: repeated };

  const pending = await findPendingDraw(getPrisma());

  if (!pending) throw new Error("El giro chocó con otro, pero no hay un giro pendiente.");

  return pending.drawnById === request.actorId ? { status: "undecided", pending } : { status: "busy", pending };
}

export type DecisionResult =
  | { status: "decided"; outcome: DecisionOutcome; emailId: string | null }
  | { status: "notFound" }
  | { status: "alreadyDecided" };

export interface DecisionRequest {
  actorId: string;
  drawId: string;
  outcome: DecisionOutcome;
  now: Date;
}

/**
 * "Ganador" or "Descartado" for the drawn ticket (RF-51). A winner gets an email with its gamertag, its ticket and the
 * hour through the outbox, in the same transaction; a discarded ticket sends nothing (RF-53). Any raffle administrator
 * can decide, so a ticket never stays blocked when the laptop of the one that spun goes down.
 */
export async function decideDraw(request: DecisionRequest): Promise<DecisionResult> {
  return getPrisma().$transaction(async (transaction) => {
    const draw = await transaction.raffleDraw.findUnique({
      where: { id: request.drawId },
      select: { ticketNumber: true, ticket: { select: { visitor: { select: { gamertag: true, email: true } } } } },
    });

    if (!draw) return { status: "notFound" };

    const updated = await transaction.raffleDraw.updateMany({
      where: { id: request.drawId, outcome: "pending" },
      data: { outcome: request.outcome, decidedAt: request.now },
    });

    if (updated.count === 0) return { status: "alreadyDecided" };

    const { gamertag, email } = draw.ticket.visitor;
    const winner = { to: email, gamertag, ticketNumber: draw.ticketNumber, decidedAt: request.now };
    const emailId = request.outcome === "winner" ? await enqueueEmail(transaction, buildWinnerEmail(winner)) : null;

    await auditDecision(transaction, request, { ticketNumber: draw.ticketNumber, gamertag });

    return { status: "decided", outcome: request.outcome, emailId };
  });
}

async function auditDecision(transaction: Transaction, request: DecisionRequest, detail: Prisma.InputJsonObject) {
  await recordAudit(transaction, {
    actorId: request.actorId,
    action: request.outcome === "winner" ? "raffle_winner_confirmed" : "raffle_ticket_discarded",
    entityType: "raffle_draw",
    entityId: request.drawId,
    detail,
  });
}

export type CloseResult =
  | { status: "closed" }
  | { status: "notStarted"; startsAt: Date }
  | { status: "alreadyClosed" }
  | { status: "pendingDraw" };

/** The number of prizes is not known beforehand: the raffle ends when an administrator closes it (RF-54). */
export async function closeRaffle(actorId: string, now: Date): Promise<CloseResult> {
  return getPrisma().$transaction(async (transaction) => {
    const schedule = await getRaffleSchedule(transaction);
    const phase = getRafflePhase(schedule, now);

    if (phase === "closed") return { status: "alreadyClosed" };

    if (phase === "upcoming") return { status: "notStarted", startsAt: schedule.startsAt };

    if (await findPendingDraw(transaction)) return { status: "pendingDraw" };

    await transaction.eventSettings.update({ where: { id: 1 }, data: { raffleClosedAt: now } });
    await recordAudit(transaction, {
      actorId,
      action: "raffle_closed",
      entityType: "event_settings",
      entityId: "1",
      detail: {
        closedAt: now.toISOString(),
        winners: await transaction.raffleDraw.count({ where: { outcome: "winner" } }),
      },
    });

    return { status: "closed" };
  });
}

export type PrizeResult =
  { status: "registered" } | { status: "notFound" } | { status: "notWinner" } | { status: "alreadyRegistered" };

/** The prize handed to a winner, written once with who registered it (RF-55). */
export async function registerPrize(actorId: string, input: PrizeInput): Promise<PrizeResult> {
  return getPrisma().$transaction(async (transaction) => {
    const updated = await transaction.raffleDraw.updateMany({
      where: { id: input.drawId, outcome: "winner", prizeName: null },
      data: { prizeName: input.prizeName, prizeById: actorId },
    });

    if (updated.count === 0) return explainPrizeRefusal(transaction, input.drawId);

    await recordAudit(transaction, {
      actorId,
      action: "raffle_prize_registered",
      entityType: "raffle_draw",
      entityId: input.drawId,
      detail: { prizeName: input.prizeName },
    });

    return { status: "registered" };
  });
}

async function explainPrizeRefusal(transaction: Transaction, drawId: string): Promise<PrizeResult> {
  const draw = await transaction.raffleDraw.findUnique({ where: { id: drawId }, select: { outcome: true } });

  if (!draw) return { status: "notFound" };

  return draw.outcome === "winner" ? { status: "alreadyRegistered" } : { status: "notWinner" };
}
