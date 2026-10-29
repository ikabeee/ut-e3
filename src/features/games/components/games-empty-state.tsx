"use client";

import { Button } from "@heroui/react";
import { GAMES_COPY } from "@features/games/lib/games-copy";

export function GamesEmptyState({ onReset }: Readonly<{ onReset: () => void }>) {
  return (
    <div className="flex flex-col items-center gap-5 border border-separator px-gutter py-[clamp(48px,8vw,96px)] text-center">
      <p className="m-0 type-wide text-[clamp(18px,2vw,24px)] tracking-[-.02em]">{GAMES_COPY.catalog.empty}</p>
      <Button variant="outline" onPress={onReset}>
        {GAMES_COPY.catalog.showAll}
      </Button>
    </div>
  );
}
