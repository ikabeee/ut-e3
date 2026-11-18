import type { EntrySchedule } from "@features/tournament/lib/entries-rules";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { EntryChannel } from "@features/tournament/lib/types";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

export interface EntryEmailInput {
  to: string;
  gamertag: string;
  channel: EntryChannel;
  schedule: Pick<EntrySchedule, "checkInStartsAt" | "checkInEndsAt">;
}

const COPY = TOURNAMENT_COPY.entryEmail;

/**
 * The confirmation of a KOF sign-up (S8). A pre-registration still owes the check-in, so it carries the day and the
 * hours; an on-site sign-up is already checked in.
 */
export function buildEntryEmail({ to, gamertag, channel, schedule }: EntryEmailInput) {
  return { to, subject: COPY.subject, text: describeEntry(gamertag, channel, schedule) };
}

function describeEntry(gamertag: string, channel: EntryChannel, schedule: EntryEmailInput["schedule"]): string {
  if (channel === "onsite") return COPY.onsite(gamertag);

  const startsAt = schedule.checkInStartsAt.toISOString();

  return COPY.pre(gamertag, {
    date: formatEventDate(startsAt, "numeric"),
    start: formatTimeOfDay(startsAt),
    end: formatTimeOfDay(schedule.checkInEndsAt.toISOString()),
  });
}
