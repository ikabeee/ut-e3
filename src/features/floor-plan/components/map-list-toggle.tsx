"use client";

import type { ReactElement } from "react";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";

interface MapListToggleProps {
  listOpen: boolean;
  onToggle: (open: boolean) => void;
}

/** The button that shows or hides the list: an eye to show it, a crossed-out eye to hide it. */
export function MapListToggle({ listOpen, onToggle }: Readonly<MapListToggleProps>): ReactElement {
  return (
    <button
      type="button"
      aria-pressed={listOpen}
      onClick={() => onToggle(!listOpen)}
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-border px-4 font-mono text-xs text-foreground uppercase transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:border-accent focus-visible:bg-accent focus-visible:text-accent-foreground active:opacity-80"
    >
      <ListToggleIcon hidden={listOpen} />
      {listOpen ? FLOOR_PLAN_COPY.list.hide : FLOOR_PLAN_COPY.list.show}
    </button>
  );
}

function ListToggleIcon({ hidden }: Readonly<{ hidden: boolean }>): ReactElement {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx={12} cy={12} r={3} />
      {hidden ? <path d="M3 3l18 18" /> : null}
    </svg>
  );
}
