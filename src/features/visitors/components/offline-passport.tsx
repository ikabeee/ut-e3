"use client";

import type { ReactNode } from "react";
import { PassportSections } from "@features/visitors/components/passport-sections";
import { usePassportSnapshot } from "@features/visitors/hooks/use-passport-snapshot";
import { describeSnapshotAge } from "@features/visitors/lib/passport-snapshot";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { useNow } from "@shared/hooks/use-now";

const REFRESH_MS = 30 * 1000;

const COPY = VISITORS_COPY.passport.offline;

/** The passport saved in this phone, with how old it is; without a copy it shows `fallback`. */
export function OfflinePassport({ fallback }: Readonly<{ fallback: ReactNode }>) {
  const snapshot = usePassportSnapshot();
  const now = useNow(REFRESH_MS);

  if (!snapshot) return fallback;

  return (
    <>
      {now > 0 && (
        <p role="status" className="text-center type-mono text-accent">
          {COPY.notice(describeSnapshotAge({ savedAt: snapshot.savedAt, now }))}
        </p>
      )}
      <PassportSections passport={snapshot.passport} visits={snapshot.visits} />
    </>
  );
}
