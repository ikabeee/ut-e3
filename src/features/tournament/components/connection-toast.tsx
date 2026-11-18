"use client";

import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { useErrorToast } from "@shared/hooks/use-error-toast";

interface ConnectionToastProps {
  /** The last request of the polling failed; the screen keeps showing the last state it received. */
  isLost: boolean;
}

/** Tells the connection was lost as a toast (S7) and takes it away when the connection comes back. */
export function ConnectionToast({ isLost }: Readonly<ConnectionToastProps>) {
  useErrorToast(isLost ? TOURNAMENT_COPY.ui.connectionLost : null);

  return null;
}
