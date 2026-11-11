"use server";

import { refresh } from "next/cache";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import { parseReason } from "@features/moderation/lib/moderation-input";
import {
  annulCheckIn,
  excludeVisitor,
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
