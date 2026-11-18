"use client";

import type { ReactElement } from "react";
import type { MapItem } from "@features/floor-plan/lib/plan-items";

interface MapListProps {
  items: readonly MapItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Every filtered item in plan order, as buttons that select it on the map; the selected one stays highlighted. */
export function MapList({ items, selectedId, onSelect }: Readonly<MapListProps>): ReactElement {
  return (
    <ul className="grid gap-2 min-[1000px]:grid-cols-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            aria-label={item.label}
            aria-pressed={item.id === selectedId}
            onClick={() => onSelect(item.id)}
            className={listEntryClass(item.id === selectedId)}
          >
            {item.code ? `${item.code} · ${item.title}` : item.title}
          </button>
        </li>
      ))}
    </ul>
  );
}

function listEntryClass(selected: boolean): string {
  return selected
    ? "min-h-11 w-full border border-accent bg-accent px-4 text-left font-mono text-xs text-accent-foreground uppercase"
    : "min-h-11 w-full border border-border px-4 text-left font-mono text-xs text-foreground uppercase transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent";
}
