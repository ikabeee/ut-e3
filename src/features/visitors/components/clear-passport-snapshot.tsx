"use client";

import { useEffect } from "react";
import { clearPassportSnapshot } from "@features/visitors/lib/passport-snapshot-storage";

/**
 * Deletes the copy of the passport saved in the phone. The registration page renders it: a phone sent there by
 * /passport is no longer the active device of any passport (RF-18, RF-70).
 */
export function ClearPassportSnapshot() {
  useEffect(() => {
    clearPassportSnapshot();
  }, []);

  return null;
}
