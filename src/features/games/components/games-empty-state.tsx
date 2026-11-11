"use client";

import { EmptyState } from "@heroui/react";
import { ActionButton } from "@shared/components/action-button";

interface GamesEmptyStateProps {
  onReset: () => void;
}

/** Mensaje cuando la búsqueda no encuentra juegos (`.empty` del diseño). */
export function GamesEmptyState({ onReset }: Readonly<GamesEmptyStateProps>) {
  return (
    <EmptyState className="flex flex-col items-center gap-4 border border-dashed border-border px-5 py-10 text-center text-base">
      <p className="m-0 text-copy-warm">Ningún juego coincide con tu búsqueda.</p>
      <ActionButton variant="outline" onPress={onReset}>
        Ver todos los juegos
      </ActionButton>
    </EmptyState>
  );
}
