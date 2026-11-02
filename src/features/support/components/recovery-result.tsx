"use client";

import { Input, Label, TextField } from "@heroui/react";
import { useSyncExternalStore } from "react";
import type { RecoveryState } from "@features/support/lib/support-actions";
import { SUPPORT_COPY } from "@features/support/lib/support-copy";
import { formatEventDate } from "@shared/lib/date-time";

interface RecoveryResultProps {
  recovery: Extract<RecoveryState, { status: "recovered" }>;
}

const COPY = SUPPORT_COPY.recovery.result;

/** What the agent hands to the visitor: who was recovered, and the link that opens the passport on the new phone. */
export function RecoveryResult({ recovery }: Readonly<RecoveryResultProps>) {
  const origin = useSyncExternalStore(subscribeToNothing, readOrigin, readServerOrigin);

  return (
    <section aria-labelledby="recovery-result-heading" className="grid gap-4 border border-border p-6">
      <h2 id="recovery-result-heading" className="type-section">
        {COPY.heading}
      </h2>
      <p className="m-0 text-lg">{COPY.visitorLine(recovery.fullName, recovery.gamertag)}</p>
      <p className="m-0 text-sm text-muted">{COPY.registeredLine(formatEventDate(recovery.registeredAt, "numeric"))}</p>
      <TextField isReadOnly>
        <Label>{COPY.linkLabel}</Label>
        <Input
          className="min-h-11 font-mono text-base"
          value={`${origin}${recovery.claimPath}`}
          onFocus={(event) => event.currentTarget.select()}
          readOnly
        />
      </TextField>
      <p className="m-0 text-sm text-muted">{COPY.instructions}</p>
    </section>
  );
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function readOrigin(): string {
  return window.location.origin;
}

function readServerOrigin(): string {
  return "";
}
