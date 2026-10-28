"use server";

import { refresh } from "next/cache";
import { requireKofAccount } from "@features/accounts/lib/server/current-account";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import {
  addEntry,
  checkInEntry,
  generateFromEntries,
  type AddEntryResult,
  type CheckInResult,
} from "@features/tournament/lib/server/entries-mutations";
import type { GenerateResult } from "@features/tournament/lib/server/tournament-mutations";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";
import { readFormText } from "@shared/lib/form-data";

export type EntriesActionState = { status: "done"; message: string } | { status: "error"; message: string };

interface Outcome {
  isDone: boolean;
  message: string;
}

const COPY = TOURNAMENT_COPY.ui.entries;

// Server Actions are public endpoints: only the KOF administrator may change the list, check in or generate (UT-TO-27).
export async function addEntryAction(
  _previous: EntriesActionState | null,
  form: FormData,
): Promise<EntriesActionState> {
  const actor = await requireKofAccount();

  if (actor.role !== "kof_admin") return failure(COPY.errors.forbidden);

  const gamertag = readFormText(form, "gamertag").trim();

  if (!gamertag) return failure(COPY.errors.gamertagRequired);

  return finish(describeAdd(await addEntry(actor.id, gamertag, new Date())));
}

export async function checkInEntryAction(
  _previous: EntriesActionState | null,
  form: FormData,
): Promise<EntriesActionState> {
  const actor = await requireKofAccount();

  if (actor.role !== "kof_admin") return failure(COPY.errors.forbidden);

  const pin = readFormText(form, "pin").trim();

  if (!pin) return failure(COPY.errors.pinRequired);

  return finish(describeCheckIn(await checkInEntry(actor.id, pin, new Date())));
}

export async function generateBracketAction(): Promise<EntriesActionState> {
  const actor = await requireKofAccount();

  if (actor.role !== "kof_admin") return failure(COPY.errors.forbidden);

  try {
    return finish(describeGenerate(await generateFromEntries(actor.id, new Date())));
  } catch (cause) {
    if (cause instanceof TournamentRuleError) return failure(cause.message);

    throw cause;
  }
}

function describeAdd(result: AddEntryResult): Outcome {
  const outcomes = COPY.outcomes;

  switch (result.status) {
    case "added":
      return done(result.channel === "pre" ? outcomes.addedPre : outcomes.addedOnsite);
    case "notOpen":
      return refused(outcomes.listOpensAt(formatEventDate(result.opensAt.toISOString(), "numeric")));
    case "closed":
      return refused(outcomes.signUpClosed);
    case "unknownGamertag":
      return refused(outcomes.unknownGamertag);
    case "alreadyEntered":
      return refused(outcomes.alreadyEntered);
    case "preListFull":
      return refused(outcomes.preListFull);
    case "tournamentFull":
      return refused(outcomes.tournamentFull);
  }
}

function describeCheckIn(result: CheckInResult): Outcome {
  const outcomes = COPY.outcomes;

  switch (result.status) {
    case "checkedIn":
      return done(outcomes.checkedIn(result.gamertag));
    case "notOpen":
      return refused(outcomes.checkInOpensAt(formatTimeOfDay(result.startsAt.toISOString())));
    case "closed":
      return refused(outcomes.checkInClosed);
    case "unknownPin":
      return refused(outcomes.unknownPin);
    case "alreadyCheckedIn":
      return refused(outcomes.alreadyCheckedIn);
    case "noShow":
      return refused(outcomes.noShow);
  }
}

function describeGenerate(result: GenerateResult): Outcome {
  const outcomes = COPY.outcomes;

  switch (result.status) {
    case "created":
      return done(outcomes.generated);
    case "tooEarly":
      return refused(outcomes.generatesAt(formatTimeOfDay(result.generatesAt.toISOString())));
    case "alreadyGenerated":
      return refused(outcomes.alreadyGenerated);
  }
}

// The screen shows the new list at once, instead of waiting for the next visit.
function finish(outcome: Outcome): EntriesActionState {
  if (!outcome.isDone) return failure(outcome.message);

  refresh();

  return { status: "done", message: outcome.message };
}

function done(message: string): Outcome {
  return { isDone: true, message };
}

function refused(message: string): Outcome {
  return { isDone: false, message };
}

function failure(message: string): EntriesActionState {
  return { status: "error", message };
}
