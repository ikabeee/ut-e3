"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { GameDetailModal } from "@features/games/components/game-detail-modal";
import { useRestoreFocusOnHide } from "@features/games/hooks/use-restore-focus-on-hide";

interface GameDetailRouteModalProps {
  title: string;
  children: ReactNode;
}

// The intercepted /games/[slug] route opened this modal by navigating, so closing it navigates back to the landing.
export function GameDetailRouteModal({ title, children }: Readonly<GameDetailRouteModalProps>) {
  const router = useRouter();

  useRestoreFocusOnHide();

  return (
    <GameDetailModal title={title} onClose={() => router.back()}>
      {children}
    </GameDetailModal>
  );
}
