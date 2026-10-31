"use client";

import { SearchField } from "@heroui/react";
import { GAMES_COPY } from "@features/games/lib/games-copy";

interface GameSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// The input is 16px on touch screens, below that Safari on iOS zooms in on focus; a mouse keeps the design's 14px.
export function GameSearchField({ value, onChange }: Readonly<GameSearchFieldProps>) {
  return (
    <SearchField
      aria-label={GAMES_COPY.catalog.searchLabel}
      value={value}
      onChange={onChange}
      className="max-w-[520px] flex-[1_1_320px] max-[760px]:max-w-none"
    >
      <SearchField.Group className="h-12 w-full gap-[10px] border-border bg-surface px-[14px] focus-within:border-accent hover:bg-surface">
        <SearchField.SearchIcon className="ms-0 size-4 shrink-0 text-muted" />
        <SearchField.Input
          placeholder={GAMES_COPY.catalog.searchPlaceholder}
          autoComplete="off"
          className="h-[46px] min-w-0 px-0.5 font-mono text-base text-foreground placeholder:text-muted pointer-fine:text-sm"
        />
      </SearchField.Group>
    </SearchField>
  );
}
