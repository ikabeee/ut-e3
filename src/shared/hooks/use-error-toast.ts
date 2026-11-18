"use client";

import { toast } from "@heroui/react";
import { useEffect } from "react";

/** Long enough to read a sentence twice; the toast can also be closed with its button. */
const ERROR_TOAST_TIMEOUT_MS = 8000;

/**
 * Every error message reaches the user as a toast (S7), announced as an alert by the region of the root layout. Pass
 * as `source` what brought the error (usually the state of the action): a new answer with the same message shows it
 * again. The toast goes away when the error does, so a fixed error never stays on screen.
 */
export function useErrorToast<Source>(error: string | null | undefined, source?: Source): void {
  useEffect(() => {
    if (!error) return;

    const id = toast.danger(error, { timeout: ERROR_TOAST_TIMEOUT_MS });

    return () => toast.close(id);
  }, [error, source]);
}
