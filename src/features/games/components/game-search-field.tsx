"use client";

import { SearchField } from "@heroui/react";

interface GameSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Buscador del catálogo (`.kw` del diseño). */
export function GameSearchField({ value, onChange }: Readonly<GameSearchFieldProps>) {
  return (
    <SearchField
      aria-label="Buscar juegos"
      value={value}
      onChange={onChange}
      className="max-w-[520px] flex-[1_1_320px] max-[760px]:max-w-none"
    >
      <SearchField.Group className="h-12 w-full gap-[10px] border-border bg-surface px-[14px] focus-within:border-accent hover:bg-surface">
        <SearchField.SearchIcon className="ms-0 size-4 shrink-0 text-muted" />
        <SearchField.Input
          placeholder="Busca un juego"
          autoComplete="off"
          className="h-[46px] min-w-0 px-0.5 font-mono text-sm text-foreground placeholder:text-muted"
        />
      </SearchField.Group>
    </SearchField>
  );
}
