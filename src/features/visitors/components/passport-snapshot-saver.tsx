"use client";

import { useEffect } from "react";
import { savePassportSnapshot } from "@features/visitors/lib/passport-snapshot-storage";
import type { Passport, PassportVisits } from "@features/visitors/lib/types";

interface PassportSnapshotSaverProps {
  passport: Passport;
  visits: PassportVisits;
}

/** Saves the passport in the phone after each load that worked, so it can be shown without a network. */
export function PassportSnapshotSaver({ passport, visits }: Readonly<PassportSnapshotSaverProps>) {
  useEffect(() => {
    savePassportSnapshot({ passport, visits, now: new Date() });
  }, [passport, visits]);

  return null;
}
