import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

/** The hours of `event_settings` as ISO instants; the page reads them and passes them, none is written here. */
export interface TournamentInfoSchedule {
  registrationOpensAt: string;
  checkInStartsAt: string;
  checkInEndsAt: string;
  onsiteStartsAt: string;
  onsiteEndsAt: string;
  bracketGeneratesAt: string;
}

export interface WhenGroup {
  /** The date as `dd.mm.yyyy` in America/Cancun; it only tells the groups apart. */
  key: string;
  label: string;
  items: string[];
}

interface WhenMoment {
  at: string;
  text: string;
}

const COPY = TOURNAMENT_COPY.ui.publicBracket.info;

/** The moments of the tournament grouped by day, the first day first and each day in order of time (S31). */
export function getWhenGroups(schedule: TournamentInfoSchedule): WhenGroup[] {
  const groups = new Map<string, WhenGroup>();

  for (const moment of getMoments(schedule).toSorted((first, second) => Date.parse(first.at) - Date.parse(second.at))) {
    const key = formatEventDate(moment.at, "numeric");
    const group = groups.get(key) ?? { key, label: formatLongEventDate(moment.at), items: [] };

    group.items.push(moment.text);
    groups.set(key, group);
  }

  return [...groups.values()];
}

/** "Viernes 13 de noviembre": the day of the week, the day and the month of the Cancun calendar date of an instant. */
export function formatLongEventDate(instant: string): string {
  const [day, month, year] = formatEventDate(instant, "numeric").split(".").map(Number);
  // Only the calendar date matters, so the weekday comes from that date at UTC, not from the instant.
  const weekday = COPY.weekdays[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

  return capitalize(COPY.longDate(weekday, day, COPY.months[month - 1]));
}

function getMoments(schedule: TournamentInfoSchedule): WhenMoment[] {
  const { when } = COPY;

  return [
    { at: schedule.registrationOpensAt, text: when.registrationOpens },
    {
      at: schedule.checkInStartsAt,
      text: when.checkIn(formatTimeOfDay(schedule.checkInStartsAt), formatTimeOfDay(schedule.checkInEndsAt)),
    },
    {
      at: schedule.onsiteStartsAt,
      text: when.onsite(formatTimeOfDay(schedule.onsiteStartsAt), formatTimeOfDay(schedule.onsiteEndsAt)),
    },
    { at: schedule.bracketGeneratesAt, text: when.bracket(formatTimeOfDay(schedule.bracketGeneratesAt)) },
  ];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
