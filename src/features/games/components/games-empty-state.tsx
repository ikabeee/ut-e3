"use client";

import { Magnifier } from "@gravity-ui/icons";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { ActionButton } from "@shared/components/action-button";
import { EmptyState } from "@shared/components/empty-state";

interface GamesEmptyStateProps {
  onReset: () => void;
}

/** Mensaje cuando la búsqueda no encuentra juegos (`.empty` del diseño). */
export function GamesEmptyState({ onReset }: Readonly<GamesEmptyStateProps>) {
  return (
    <EmptyState icon={Magnifier} size="lg" title={GAMES_COPY.catalog.empty}>
      <ActionButton variant="outline" onPress={onReset}>
        {GAMES_COPY.catalog.showAll}
      </ActionButton>
    </EmptyState>
  );
}
