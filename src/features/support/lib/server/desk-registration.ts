import "server-only";
import { getEntryWindow } from "@features/tournament/lib/entries-rules";
import { addEntry } from "@features/tournament/lib/server/entries-mutations";
import { getEntrySchedule } from "@features/tournament/lib/server/entries-queries";
import type { ValidRegistrationInput } from "@features/visitors/lib/registration-input";
import { getRegistrationOpensAt, registerVisitorRecord } from "@features/visitors/lib/server/visitor-registration";
import { getClaimPath } from "@features/visitors/lib/visitors-links";
import type { RateLimitRule } from "@shared/lib/server/rate-limit";

/** What happened with the optional entry to the tournament that the agent asked for. */
export type EnrollmentOutcome = "none" | "enrolled" | "notOnsite" | "refused";

export type DeskRegistrationResult =
  | {
      status: "created";
      pin: string;
      /** Path that opens the passport on the visitor's phone; the browser adds the origin. */
      claimPath: string;
      emailId: string;
      enrollment: EnrollmentOutcome;
    }
  | { status: "closed" | "blocked" | "gamertagTaken" };

export interface DeskRegistrationRequest {
  agentId: string;
  input: ValidRegistrationInput;
  wantsTournament: boolean;
  now: Date;
}

// A desk serves one person at a time: the limit stops a stolen session from filling the table with passports.
export const REGISTRATION_AGENT_RULE: RateLimitRule = { limit: 30, windowMs: 60 * 60 * 1000 };

/**
 * Registers a visitor in person with the same checks as the public registration (it is the same function: blocklist,
 * staff emails, unique email and gamertag), audited with the agent that did it. The agent gets the PIN and the link to
 * open the passport on the visitor's phone, and may enter the visitor in the KOF during the on-site sign-up (RF-58).
 */
export async function registerVisitorAtDesk(request: DeskRegistrationRequest): Promise<DeskRegistrationResult> {
  const { agentId, input, wantsTournament, now } = request;
  const opensAt = await getRegistrationOpensAt();

  if (!opensAt || now < opensAt) return { status: "closed" };

  const result = await registerVisitorRecord(input, now, agentId);

  if (result.status !== "created") return { status: result.status };

  return {
    status: "created",
    pin: result.pin,
    claimPath: getClaimPath(result.deviceToken),
    emailId: result.emailId,
    enrollment: wantsTournament ? await enrollOnsite({ agentId, gamertag: input.gamertag, now }) : "none",
  };
}

// The checkbox only shows during the on-site sign-up, but the form can arrive late or forged: the hour is checked here.
async function enrollOnsite(request: { agentId: string; gamertag: string; now: Date }): Promise<EnrollmentOutcome> {
  const { agentId, gamertag, now } = request;

  if (getEntryWindow(await getEntrySchedule(), now) !== "onsite") return "notOnsite";

  const result = await addEntry(agentId, gamertag, now);

  return result.status === "added" ? "enrolled" : "refused";
}
