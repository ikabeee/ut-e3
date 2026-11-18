"use client";

import { Toast, toast } from "@heroui/react";
import { useEffect } from "react";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";

interface ConnectionToastProps {
  /** The last request of the polling failed; the screen keeps showing the last state it received. */
  isLost: boolean;
}

/** How long the message stays before it hides by itself; it can also be closed with its button. */
const TOAST_TIMEOUT_MS = 8000;

/** Tells the connection was lost as a toast (S6) and takes it away when the connection comes back. */
export function ConnectionToast({ isLost }: Readonly<ConnectionToastProps>) {
  useEffect(() => {
    if (!isLost) return;

    const id = toast.danger(TOURNAMENT_COPY.ui.connectionLost, { timeout: TOAST_TIMEOUT_MS });

    return () => toast.close(id);
  }, [isLost]);

  return <Toast.Provider placement="bottom" />;
}
