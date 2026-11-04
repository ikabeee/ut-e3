import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { readFormText } from "@shared/lib/form-data";

export type DecisionOutcome = "winner" | "discarded";

export interface ParseFailure {
  ok: false;
  message: string;
}

export type ParseResult<T> = { ok: true; value: T } | ParseFailure;

export interface PrizeInput {
  drawId: string;
  prizeName: string;
}

export const MAX_PRIZE_NAME = 80;

// The panel generates the id with crypto.randomUUID(); anything else is not a request of the panel.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERRORS = RAFFLE_COPY.admin.errors;

/** The id of one press of "Girar" (RNF-05): the same id twice is the same spin. */
export function parseSpinRequest(form: FormData): ParseResult<string> {
  const requestId = readFormText(form, "requestId").trim();

  return UUID.test(requestId) ? { ok: true, value: requestId } : invalid();
}

export function parseDecision(form: FormData): ParseResult<{ drawId: string; outcome: DecisionOutcome }> {
  const drawId = readFormText(form, "drawId").trim();
  const outcome = readFormText(form, "outcome");

  if (!UUID.test(drawId) || (outcome !== "winner" && outcome !== "discarded")) return invalid();

  return { ok: true, value: { drawId, outcome } };
}

export function parsePrize(form: FormData): ParseResult<PrizeInput> {
  const drawId = readFormText(form, "drawId").trim();
  const prizeName = readFormText(form, "prizeName").replace(/\s+/g, " ").trim();

  if (!UUID.test(drawId)) return invalid();

  if (!prizeName) return { ok: false, message: ERRORS.prizeRequired };

  if (prizeName.length > MAX_PRIZE_NAME) return { ok: false, message: ERRORS.prizeTooLong };

  return { ok: true, value: { drawId, prizeName } };
}

function invalid(): ParseFailure {
  return { ok: false, message: ERRORS.invalidRequest };
}
