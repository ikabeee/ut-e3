import type { EntryStatus, EntryView } from "@features/tournament/lib/types";

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

/** "all" or one status: the filters the staff picks above the list. */
export type EntryStatusFilter = "all" | EntryStatus;

export const ENTRY_STATUS_FILTERS: readonly EntryStatusFilter[] = ["all", "registered", "checked_in", "no_show"];

export interface EntryFilter {
  text: string;
  status: EntryStatusFilter;
  /** The entry the server found for the text as a PIN; the browser never sees the PINs themselves. */
  pinMatchId: string | null;
}

/**
 * The entries with the status of the filter whose gamertag or name contain the text, ignoring case and accents, plus
 * the one whose PIN is the text. An empty text keeps every entry of the status.
 */
export function filterEntries(entries: readonly EntryView[], filter: EntryFilter): EntryView[] {
  const query = normalizeText(filter.text);

  return entries.filter(
    (entry) => matchesStatus(entry, filter.status) && matchesQuery(entry, query, filter.pinMatchId),
  );
}

/** How many entries each filter shows, for its label. */
export function countByStatusFilter(counts: EntryCounts, total: number): Record<EntryStatusFilter, number> {
  return { all: total, registered: counts.registered, checked_in: counts.checkedIn, no_show: counts.noShow };
}

function matchesStatus(entry: EntryView, status: EntryStatusFilter): boolean {
  return status === "all" || entry.status === status;
}

function matchesQuery(entry: EntryView, query: string, pinMatchId: string | null): boolean {
  if (query === "" || entry.id === pinMatchId) return true;

  return normalizeText(entry.gamertag).includes(query) || normalizeText(entry.fullName).includes(query);
}

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function countWhere(entries: readonly EntryView[], predicate: (entry: EntryView) => boolean): number {
  return entries.filter(predicate).length;
}
