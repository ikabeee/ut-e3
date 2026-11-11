"use client";

import { useCallback, useState } from "react";
import { useAdminRaffle, type AdminSnapshotLoader } from "@features/raffle/hooks/use-raffle-snapshot";
import { resolvePendingDraw, type OptimisticDraw } from "@features/raffle/lib/raffle-pending";
import type { PendingDraw, RaffleAdminSnapshot } from "@features/raffle/lib/types";

export interface RaffleDashboardState {
  snapshot: RaffleAdminSnapshot;
  hasConnectionError: boolean;
  /** The ticket that waits for a decision, with what this screen already knows from its own actions. */
  pending: PendingDraw | null;
  /** This administrator spun it, or chose to decide it: the decision opens here. */
  decidesPending: boolean;
  onDrawn: (draw: PendingDraw) => void;
  onDecided: (drawId: string) => void;
  onTakeOver: (drawId: string) => void;
  onChanged: () => void;
}

interface RaffleDashboardOptions {
  initial: RaffleAdminSnapshot;
  viewerId: string;
  load?: AdminSnapshotLoader;
}

/** The state of the panel: the polled raffle plus the answers of this screen, which do not wait for the next poll. */
export function useRaffleDashboard({ initial, viewerId, load }: RaffleDashboardOptions): RaffleDashboardState {
  const { value: snapshot, hasConnectionError, refresh } = useAdminRaffle(initial, load);
  const [optimistic, setOptimistic] = useState<OptimisticDraw | null>(null);
  const [takenOverId, setTakenOverId] = useState<string | null>(null);
  const pending = resolvePendingDraw(snapshot, optimistic);
  const { revision } = snapshot;

  const onDrawn = useCallback(
    (draw: PendingDraw) => {
      setOptimistic({ kind: "drawn", draw, baseRevision: revision });
      void refresh();
    },
    [revision, refresh],
  );

  const onDecided = useCallback(
    (drawId: string) => {
      setOptimistic({ kind: "decided", drawId, baseRevision: revision });
      void refresh();
    },
    [revision, refresh],
  );

  const onChanged = useCallback(() => void refresh(), [refresh]);

  return {
    snapshot,
    hasConnectionError,
    pending,
    decidesPending: pending !== null && (pending.drawnById === viewerId || pending.id === takenOverId),
    onDrawn,
    onDecided,
    onTakeOver: setTakenOverId,
    onChanged,
  };
}
