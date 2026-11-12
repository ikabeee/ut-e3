"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { requireRecoveryAgent } from "@features/accounts/lib/server/current-account";
import { parseRecoveryInput } from "@features/support/lib/recovery-input";
import {
  REGISTRATION_AGENT_RULE,
  registerVisitorAtDesk,
  type DeskRegistrationResult,
  type EnrollmentOutcome,
} from "@features/support/lib/server/desk-registration";
import { AGENT_RULE, recoverPassport } from "@features/support/lib/server/passport-recovery";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { parseRegistrationInput, type ValidRegistrationInput } from "@features/visitors/lib/registration-input";
import { VISITOR_PINS_CACHE_TAG } from "@features/visitors/lib/visitor-cache-tags";
import { readFormText } from "@shared/lib/form-data";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { consumeAttempt, refundAttempt } from "@shared/lib/server/rate-limit";

export type RecoveryState =
  | {
      status: "recovered";
      fullName: string;
      gamertag: string;
      /** ISO date of the registration, so the state crosses to the browser as plain text. */
      registeredAt: string;
      /** Path that opens the passport on the visitor's phone; the browser adds the origin. */
      claimPath: string;
    }
  | { status: "error"; message: string };

const ERRORS = SUPPORT_COPY.recovery.errors;

// Server Actions are public endpoints: the session is checked before the form is read.
export async function recoverPassportAction(_previous: RecoveryState | null, form: FormData): Promise<RecoveryState> {
  const agent = await requireRecoveryAgent();
  const parsed = parseRecoveryInput(form);

  if (!parsed.ok) return failure(parsed.message);

  if (!(await consumeAttempt(`recovery-agent:${agent.id}`, AGENT_RULE))) return failure(ERRORS.agentLimit);

  const result = await recoverPassport(agent.id, parsed.value, new Date());

  if (result.status === "recovered") {
    return { ...result, registeredAt: result.registeredAt.toISOString() };
  }

  return failure(result.status === "visitorLimit" ? ERRORS.visitorLimit : ERRORS.identityMismatch);
}

function failure(message: string): RecoveryState {
  return { status: "error", message };
}

export type DeskRegistrationState =
  | {
      status: "registered";
      fullName: string;
      gamertag: string;
      pin: string;
      /** Path that opens the passport on the visitor's phone; the browser adds the origin. */
      claimPath: string;
      enrollment: EnrollmentOutcome;
    }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"fullName" | "gamertag" | "email", string>>;
    };

const REGISTER_ERRORS = SUPPORT_COPY.register.errors;

/**
 * Registers a visitor in person (RF-69 desk). The session is checked first; the rest is the registration of the public
 * form with the agent as the author of the audit entry, and a limit per agent per hour.
 */
export async function registerVisitorAtDeskAction(
  _previous: DeskRegistrationState | null,
  form: FormData,
): Promise<DeskRegistrationState> {
  const agent = await requireRecoveryAgent();
  const parsed = parseRegistrationInput(form);

  if (!parsed.ok) return { status: "error", message: REGISTER_ERRORS.invalid, fieldErrors: parsed.fieldErrors };

  const key = `desk-registration:${agent.id}`;
  const attemptedAt = new Date();

  if (!(await consumeAttempt(key, REGISTRATION_AGENT_RULE, attemptedAt))) {
    return { status: "error", message: REGISTER_ERRORS.agentLimit };
  }

  const result = await registerVisitorAtDesk({
    agentId: agent.id,
    input: parsed.value,
    wantsTournament: readFormText(form, "enrollInTournament") === "on",
    now: attemptedAt,
  });

  // A taken gamertag is a typo of the desk, not a new passport: the attempt is given back.
  if (result.status === "gamertagTaken") await refundAttempt(key, REGISTRATION_AGENT_RULE, attemptedAt);

  return describeRegistration(result, parsed.value);
}

function describeRegistration(result: DeskRegistrationResult, input: ValidRegistrationInput): DeskRegistrationState {
  if (result.status === "gamertagTaken") {
    return {
      status: "error",
      message: REGISTER_ERRORS.invalid,
      fieldErrors: { gamertag: REGISTER_ERRORS.gamertagTaken },
    };
  }

  if (result.status !== "created") {
    return { status: "error", message: result.status === "closed" ? REGISTER_ERRORS.closed : REGISTER_ERRORS.rejected };
  }

  // The filter of the kiosks must include the new PIN (RNF-19).
  updateTag(VISITOR_PINS_CACHE_TAG);
  after(async () => {
    await deliverQueuedEmail(result.emailId);
  });

  const { fullName, gamertag } = input;

  return {
    status: "registered",
    fullName,
    gamertag,
    pin: result.pin,
    claimPath: result.claimPath,
    enrollment: result.enrollment,
  };
}
