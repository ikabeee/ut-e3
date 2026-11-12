"use server";

import { refresh } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import { parseReason } from "@features/moderation/lib/moderation-input";
import {
  annulCheckIn,
  annulCheckIns,
  excludeVisitor,
  excludeVisitorsOfCheckIns,
  type BulkResult,
  type AnnulResult,
  type ModerationRequest,
} from "@features/moderation/lib/server/moderation-mutations";
import { readFormText } from "@shared/lib/form-data";

export type ModerationActionState = { status: "done"; message: string } | { status: "error"; message: string };

const { outcomes: OUTCOMES, errors: ERRORS } = MODERATION_COPY;

// Server Actions are public endpoints: only the sysadmin annuls visits or excludes visitors (RF-46).
export async function annulCheckInAction(
  _previous: ModerationActionState | null,
  form: FormData,
): Promise<ModerationActionState> {
  const request = await readRequest(form, "checkInId");

  if (!request) return { status: "error", message: ERRORS.reasonLength };

  const result = await annulCheckIn(request);

  if (result.status !== "annulled") return { status: "error", message: ERRORS[result.status] };

  refresh();

  return { status: "done", message: describeAnnulment(result) };
}

export async function excludeVisitorAction(
  _previous: ModerationActionState | null,
  form: FormData,
): Promise<ModerationActionState> {
  const request = await readRequest(form, "visitorId");

  if (!request) return { status: "error", message: ERRORS.reasonLength };

  const result = await excludeVisitor(request);

  if (result.status !== "excluded") return { status: "error", message: ERRORS[result.status] };

  refresh();

  return { status: "done", message: OUTCOMES.excluded };
}

/**
 * The visits ticked in a list of a burst or of a stand: `intent` says whether they are annulled or their visitors
 * excluded, with one reason for all (RF-46). Each one writes its own audit entry.
 */
export async function moderateSelectionAction(
  _previous: ModerationActionState | null,
  form: FormData,
): Promise<ModerationActionState> {
  const actor = await requireSysadmin();
  const parsed = parseReason(form);
  const checkInIds = form.getAll("checkInId").filter((id): id is string => typeof id === "string" && id !== "");
  const intent = readFormText(form, "intent");

  if (!parsed.isValid) return { status: "error", message: ERRORS.reasonLength };

  if (checkInIds.length === 0) return { status: "error", message: ERRORS.nothingSelected };

  const request = { actorId: actor.id, checkInIds, reason: parsed.reason, now: new Date() };
  const isExclusion = intent === "exclude";
  const result = await (isExclusion ? excludeVisitorsOfCheckIns(request) : annulCheckIns(request));

  if (result.done === 0) return { status: "error", message: ERRORS.nothingChanged };

  refresh();

  return { status: "done", message: describeBulk(result, isExclusion) };
}

function describeBulk(result: BulkResult, isExclusion: boolean): string {
  return (isExclusion ? OUTCOMES.bulkExcluded : OUTCOMES.bulkAnnulled)(result.done, result.skipped);
}

// The session first, then the form: who acts, on what, and why. Null when the reason is missing or too long.
async function readRequest(form: FormData, targetField: string): Promise<ModerationRequest | null> {
  const actor = await requireSysadmin();
  const parsed = parseReason(form);

  if (!parsed.isValid) return null;

  return { actorId: actor.id, targetId: readFormText(form, targetField), reason: parsed.reason, now: new Date() };
}

function describeAnnulment(result: Extract<AnnulResult, { status: "annulled" }>): string {
  if (result.ticketsFrozen) return OUTCOMES.annulledFrozen;

  return result.voidedMilestones.length > 0 ? OUTCOMES.annulledVoided(result.voidedMilestones) : OUTCOMES.annulled;
}
