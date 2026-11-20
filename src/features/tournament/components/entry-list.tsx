"use client";

import { Label, SearchField, ToggleButton, ToggleButtonGroup, type Key } from "@heroui/react";
import { useState } from "react";
import { usePinMatch, type PinLookup } from "@features/tournament/hooks/use-pin-match";
import {
  countByStatusFilter,
  ENTRY_STATUS_FILTERS,
  filterEntries,
  getEntryCounts,
  type EntryStatusFilter,
} from "@features/tournament/lib/entries-view";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { EntryView } from "@features/tournament/lib/types";

interface EntryListProps {
  entries: readonly EntryView[];
  /** Searches by PIN on the server; without it (the read-only monitor) the search covers the gamertag and the name. */
  findByPin?: PinLookup;
}

const COPY = TOURNAMENT_COPY.ui.entries;

/** The participants with a search by gamertag, name or PIN and a filter by status, for the KOF staff. */
export function EntryList({ entries, findByPin }: Readonly<EntryListProps>) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<EntryStatusFilter>("all");
  const pinMatchId = usePinMatch(text, findByPin);

  if (entries.length === 0) return <p className="type-mono text-muted">{COPY.empty}</p>;

  const shown = filterEntries(entries, { text, status, pinMatchId });
  const counts = countByStatusFilter(getEntryCounts(entries), entries.length);

  return (
    <div className="grid gap-4">
      <SearchField value={text} onChange={setText} className="grid gap-2">
        <Label>{COPY.search.label}</Label>
        <SearchField.Group className="min-h-11">
          <SearchField.SearchIcon />
          <SearchField.Input className="text-base" placeholder={COPY.search.placeholder(findByPin !== undefined)} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <StatusFilters status={status} counts={counts} onChange={setStatus} />
      <p aria-live="polite" className="type-tiny text-muted">
        {COPY.search.shown(shown.length, entries.length)}
      </p>
      <EntryItems entries={shown} />
    </div>
  );
}

interface StatusFiltersProps {
  status: EntryStatusFilter;
  counts: Record<EntryStatusFilter, number>;
  onChange: (status: EntryStatusFilter) => void;
}

function StatusFilters({ status, counts, onChange }: Readonly<StatusFiltersProps>) {
  return (
    <ToggleButtonGroup
      aria-label={COPY.filters.label}
      selectionMode="single"
      disallowEmptySelection
      isDetached
      selectedKeys={[status]}
      onSelectionChange={(keys) => onChange(readStatus(keys))}
      className="flex flex-wrap gap-2"
    >
      {ENTRY_STATUS_FILTERS.map((filter) => (
        <ToggleButton key={filter} id={filter} className="toggle-button--filter min-h-11">
          {COPY.filters.option(COPY.filters.options[filter], counts[filter])}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

// The group allows a single selection and never an empty one, so the set holds one of the filters.
function readStatus(keys: Set<Key>): EntryStatusFilter {
  const [key] = keys;

  return ENTRY_STATUS_FILTERS.find((filter) => filter === key) ?? "all";
}

function EntryItems({ entries }: Readonly<{ entries: readonly EntryView[] }>) {
  if (entries.length === 0) return <p className="type-mono text-muted">{COPY.search.noResults}</p>;

  return (
    <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 border border-border p-3">
          <span className="grid min-w-0">
            <span className="truncate font-bold">{entry.gamertag}</span>
            <span className="truncate text-sm text-muted">{entry.fullName}</span>
          </span>
          <span className="shrink-0 text-right type-tiny text-muted">
            {COPY.channels[entry.channel]} · {COPY.statuses[entry.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
