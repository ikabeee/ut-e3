"use client";

import type { ReactElement } from "react";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import type { MapFilter } from "@features/floor-plan/lib/plan-items";

export interface FilterCounts {
  stands: number;
  activities: number;
  services: number;
}

interface MapFiltersProps {
  active: MapFilter;
  counts: FilterCounts;
  onChange: (filter: MapFilter) => void;
}

/** The four chips that filter the markers and the list: exactly one is pressed. */
export function MapFilters({ active, counts, onChange }: Readonly<MapFiltersProps>): ReactElement {
  const chips: ReadonlyArray<{ filter: MapFilter; label: string }> = [
    { filter: "all", label: FLOOR_PLAN_COPY.filters.all },
    { filter: "stand", label: chipLabel(FLOOR_PLAN_COPY.filters.stands, counts.stands) },
    { filter: "activity", label: chipLabel(FLOOR_PLAN_COPY.filters.activities, counts.activities) },
    { filter: "service", label: chipLabel(FLOOR_PLAN_COPY.filters.services, counts.services) },
  ];

  return (
    <div
      role="group"
      aria-label={FLOOR_PLAN_COPY.filters.groupLabel}
      className="scrollbar-none flex flex-nowrap gap-2 overflow-x-auto"
    >
      {chips.map((chip) => (
        <button
          key={chip.filter}
          type="button"
          aria-pressed={active === chip.filter}
          onClick={() => onChange(chip.filter)}
          className={chipClass(active === chip.filter)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function chipLabel(label: string, count: number): string {
  return FLOOR_PLAN_COPY.filters.chipLabel(label, count);
}

function chipClass(pressed: boolean): string {
  return pressed
    ? "min-h-11 shrink-0 cursor-pointer bg-foreground px-4 font-mono text-xs font-bold text-background uppercase transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground active:opacity-80"
    : "min-h-11 shrink-0 cursor-pointer border border-border px-4 font-mono text-xs text-muted uppercase transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:border-accent focus-visible:bg-accent focus-visible:text-accent-foreground active:opacity-80";
}
