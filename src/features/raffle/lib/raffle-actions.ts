"use server";

import { after } from "next/server";
import { requireRaffleAdmin } from "@features/accounts/lib/server/current-account";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { parseDecision, parsePrize, parseSpinRequest } from "@features/raffle/lib/raffle-input";
import {
  closeRaffle,
  decideDraw,
  registerPrize,
  spinRaffle,
  type CloseResult,
  type DecisionResult,
  type PrizeResult,
  type SpinResult,
} from "@features/raffle/lib/server/raffle-mutations";
import type { PendingDraw } from "@features/raffle/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";

export interface ActionFailure {
  status: "error";
  message: string;
}

export type SpinActionState = { status: "drawn"; draw: PendingDraw } | ActionFailure;

/** What the decision, the closing and the prize answer: done, or the message to show. */
export type RaffleActionState = { status: "done" } | ActionFailure;

const ERRORS = RAFFLE_COPY.admin.errors;

const DONE: RaffleActionState = { status: "done" };

// Server Actions are public endpoints: the session and the role are checked before the form is read.
export async function spinRaffleAction(_previous: SpinActionState | null, form: FormData): Promise<SpinActionState> {
  const actor = await requireRaffleAdmin();
  const parsed = parseSpinRequest(form);

  if (!parsed.ok) return failure(parsed.message);

  return toSpinState(await spinRaffle({ actorId: actor.id, requestId: parsed.value, now: new Date() }));
}

function toSpinState(result: SpinResult): SpinActionState {
  switch (result.status) {
    case "drawn":
      return result;
    case "notStarted":
      return failure(ERRORS.notStarted(formatTimeOfDay(result.startsAt.toISOString())));
    case "closed":
      return failure(ERRORS.closed);
    case "noTickets":
      return failure(ERRORS.noTickets);
    case "busy":
      return failure(ERRORS.busy);
    case "undecided":
      return failure(ERRORS.undecided(result.pending.ticketNumber));
  }
}

export async function decideDrawAction(
  _previous: RaffleActionState | null,
  form: FormData,
): Promise<RaffleActionState> {
  const actor = await requireRaffleAdmin();
  const parsed = parseDecision(form);

  if (!parsed.ok) return failure(parsed.message);

  return toDecisionState(await decideDraw({ actorId: actor.id, ...parsed.value, now: new Date() }));
}

// The email leaves after the answer; a failure stays in the outbox and the interval of instrumentation.ts retries it.
function toDecisionState(result: DecisionResult): RaffleActionState {
  if (result.status === "notFound") return failure(ERRORS.drawNotFound);

  if (result.status === "alreadyDecided") return failure(ERRORS.alreadyDecided);

  const { emailId } = result;

  if (emailId) after(() => deliverQueuedEmail(emailId));

  return DONE;
}

export async function closeRaffleAction(): Promise<RaffleActionState> {
  const actor = await requireRaffleAdmin();

  return toCloseState(await closeRaffle(actor.id, new Date()));
}

function toCloseState(result: CloseResult): RaffleActionState {
  if (result.status === "closed") return DONE;

  if (result.status === "alreadyClosed") return failure(ERRORS.closed);

  if (result.status === "pendingDraw") return failure(ERRORS.pendingDraw);

  return failure(ERRORS.notStarted(formatTimeOfDay(result.startsAt.toISOString())));
}

export async function registerPrizeAction(
  _previous: RaffleActionState | null,
  form: FormData,
): Promise<RaffleActionState> {
  const actor = await requireRaffleAdmin();
  const parsed = parsePrize(form);

  if (!parsed.ok) return failure(parsed.message);

  return toPrizeState(await registerPrize(actor.id, parsed.value));
}

function toPrizeState(result: PrizeResult): RaffleActionState {
  switch (result.status) {
    case "registered":
      return DONE;
    case "notFound":
      return failure(ERRORS.drawNotFound);
    case "notWinner":
      return failure(ERRORS.notWinner);
    case "alreadyRegistered":
      return failure(ERRORS.prizeAlreadyRegistered);
  }
}

function failure(message: string): ActionFailure {
  return { status: "error", message };
}
