"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { addSelfEntry, type SelfEntryResult } from "@features/tournament/lib/server/entries-mutations";
import { formatEventDate } from "@shared/lib/date-time";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { getDeviceVisitorId } from "@shared/lib/server/visitor-device";

export type SelfEntryState = { status: "done"; message: string } | { status: "error"; message: string };

const COPY = TOURNAMENT_COPY.ui.entries.selfEntry;

/**
 * The visitor of the passport session (the device cookie, as in `/passport`) enrolls themselves. The visitor is never
 * read from the form, so nobody can enroll somebody else. Repeating it is harmless: it answers "ya estás inscrito".
 */
export async function enrollSelfAction(): Promise<SelfEntryState> {
  const visitorId = await getDeviceVisitorId();

  if (!visitorId) return failure(COPY.noPassport);

  const result = await addSelfEntry(visitorId, new Date());

  if (result.status === "added") after(() => deliverQueuedEmail(result.emailId));

  return finish(result);
}

function finish(result: SelfEntryResult): SelfEntryState {
  const message = describe(result);

  if (result.status !== "added" && result.status !== "alreadyEntered") return failure(message);

  refresh();

  return { status: "done", message };
}

function describe(result: SelfEntryResult): string {
  switch (result.status) {
    case "added":
      return COPY.enrolled;
    case "alreadyEntered":
      return COPY.alreadyEnrolled;
    case "notOpen":
      return COPY.notOpen(formatEventDate(result.opensAt.toISOString(), "numeric"));
    case "closed":
      return COPY.closed;
    case "preListFull":
    case "tournamentFull":
      return COPY.full;
    case "ended":
      return COPY.ended;
    case "excluded":
      return COPY.excluded;
    case "unknownGamertag":
      return COPY.noPassport;
  }
}

function failure(message: string): SelfEntryState {
  return { status: "error", message };
}
