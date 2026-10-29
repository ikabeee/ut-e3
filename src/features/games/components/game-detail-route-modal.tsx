"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { GameDetailModal } from "@features/games/components/game-detail-modal";

interface GameDetailRouteModalProps {
  title: string;
  children: ReactNode;
}

// The intercepted /games/[slug] route opened this modal by navigating, so closing it navigates back to the landing.
export function GameDetailRouteModal({ title, children }: Readonly<GameDetailRouteModalProps>) {
  const router = useRouter();

  return (
    <GameDetailModal title={title} onClose={() => router.back()}>
      {children}
    </GameDetailModal>
  );
}
