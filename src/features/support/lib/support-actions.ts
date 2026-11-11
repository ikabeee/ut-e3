"use server";

import { requireRecoveryAgent } from "@features/accounts/lib/server/current-account";
import { parseRecoveryInput } from "@features/support/lib/recovery-input";
import { AGENT_RULE, recoverPassport } from "@features/support/lib/server/passport-recovery";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { consumeAttempt } from "@shared/lib/server/rate-limit";

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
