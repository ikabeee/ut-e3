import type { EntryView } from "@features/tournament/lib/types";

export interface EntryCounts {
  registered: number;
  checkedIn: number;
  noShow: number;
  /** Entries added through the pre-registration list, which is capped at 50. */
  preList: number;
  /** The places in use out of 64: every entry that did not miss the check-in. */
  places: number;
}

export function getEntryCounts(entries: readonly EntryView[]): EntryCounts {
  const noShow = countWhere(entries, (entry) => entry.status === "no_show");

  return {
    registered: countWhere(entries, (entry) => entry.status === "registered"),
    checkedIn: countWhere(entries, (entry) => entry.status === "checked_in"),
    noShow,
    preList: countWhere(entries, (entry) => entry.channel === "pre"),
    places: entries.length - noShow,
  };
}

function countWhere(entries: readonly EntryView[], predicate: (entry: EntryView) => boolean): number {
  return entries.filter(predicate).length;
}
