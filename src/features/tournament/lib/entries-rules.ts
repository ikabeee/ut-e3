/** The hours of `event_settings` that decide what the KOF administrator can do with the entries. */
export interface EntrySchedule {
  registrationOpensAt: Date;
  checkInStartsAt: Date;
  checkInEndsAt: Date;
  onsiteStartsAt: Date;
  onsiteEndsAt: Date;
  bracketGeneratesAt: Date;
}

export type EntryWindow = "notOpen" | "pre" | "onsite" | "closed";

/**
 * What adding a visitor means right now: a pre-registration from the opening of the list until the on-site sign-up
 * starts, an on-site entry (already checked in) while that sign-up lasts, and nothing before or after (RF-58, RF-77).
 */
export function getEntryWindow(schedule: EntrySchedule, now: Date): EntryWindow {
  if (now < schedule.registrationOpensAt) return "notOpen";

  if (now >= schedule.onsiteEndsAt) return "closed";

  return now >= schedule.onsiteStartsAt ? "onsite" : "pre";
}
