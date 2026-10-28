import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { EntryStatus } from "@features/tournament/lib/types";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

interface TournamentNoticeProps {
  status: EntryStatus;
  /** The hours of the check-in come from `event_settings`, never from this file. */
  checkInStartsAt: string;
  checkInEndsAt: string;
}

const COPY = TOURNAMENT_COPY.ui.entries.passportNotice;

/** What the passport of a player says about the tournament (RF-75). */
export function TournamentNotice({ status, checkInStartsAt, checkInEndsAt }: Readonly<TournamentNoticeProps>) {
  return (
    <section
      aria-labelledby="tournament-notice-heading"
      className="w-full max-w-sm border border-border p-4 text-center"
    >
      <h2 id="tournament-notice-heading" className="type-tiny text-muted">
        {COPY.heading}
      </h2>
      <p className="mt-2 text-sm">{getMessage(status, checkInStartsAt, checkInEndsAt)}</p>
    </section>
  );
}

function getMessage(status: EntryStatus, startsAt: string, endsAt: string): string {
  if (status === "checked_in") return COPY.checkedIn;

  if (status === "no_show") return COPY.noShow;

  return COPY.registered(formatEventDate(startsAt, "numeric"), formatTimeOfDay(startsAt), formatTimeOfDay(endsAt));
}
