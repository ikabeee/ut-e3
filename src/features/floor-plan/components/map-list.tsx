"use client";

import type { ReactElement } from "react";
import type { MapItem } from "@features/floor-plan/lib/plan-items";

interface MapListProps {
  items: readonly MapItem[];
  onSelect: (id: string) => void;
}

/** Every filtered item in plan order, as buttons that select it: the map alternative for keyboard. */
export function MapList({ items, onSelect }: Readonly<MapListProps>): ReactElement {
  return (
    <ul className="grid gap-2 min-[1000px]:grid-cols-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            aria-label={item.label}
            onClick={() => onSelect(item.id)}
            className="min-h-11 w-full border border-border px-4 text-left font-mono text-xs text-foreground uppercase"
          >
            {item.code ? `${item.code} · ${item.title}` : item.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
