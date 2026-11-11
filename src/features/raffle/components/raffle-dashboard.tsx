"use client";

import { Button } from "@heroui/react";
import { AdminWinners } from "@features/raffle/components/admin-winners";
import { DrawDecisionDialog, type RaffleAction } from "@features/raffle/components/draw-decision-dialog";
import { RaffleStatus } from "@features/raffle/components/raffle-status";
import { SpinButton, type SpinAction } from "@features/raffle/components/spin-button";
import { useRaffleDashboard } from "@features/raffle/hooks/use-raffle-dashboard";
import type { AdminSnapshotLoader } from "@features/raffle/hooks/use-raffle-snapshot";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { PendingDraw, RaffleAdminSnapshot } from "@features/raffle/lib/types";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";

export interface RaffleDashboardActions {
  spin: SpinAction;
  decide: RaffleAction;
  close: RaffleAction;
  registerPrize: RaffleAction;
}

interface RaffleDashboardProps {
  initial: RaffleAdminSnapshot;
  /** The signed-in administrator: only the one that spun sees the decision at once. */
  viewerId: string;
  actions: RaffleDashboardActions;
  /** Replaces the request to the server; the tests pass their own. */
  load?: AdminSnapshotLoader;
}

const COPY = RAFFLE_COPY.admin;

export function RaffleDashboard({ initial, viewerId, actions, load }: Readonly<RaffleDashboardProps>) {
  const state = useRaffleDashboard({ initial, viewerId, load });
  const { snapshot, pending, decidesPending } = state;

  return (
    <div className="grid gap-10">
      {state.hasConnectionError && (
        <p role="status" className="m-0 text-sm text-danger">
          {COPY.connectionLost}
        </p>
      )}
      <RaffleStatus snapshot={snapshot} />
      <section aria-label={COPY.spin.label} className="grid gap-4">
        <SpinButton
          spin={actions.spin}
          isDisabled={snapshot.phase !== "open" || pending !== null}
          onDrawn={state.onDrawn}
        />
        {pending && !decidesPending && <BusyNotice pending={pending} onTakeOver={state.onTakeOver} />}
      </section>
      {pending && decidesPending && (
        <DrawDecisionDialog draw={pending} decide={actions.decide} onDecided={state.onDecided} />
      )}
      <AdminWinners winners={snapshot.winners} registerPrize={actions.registerPrize} onChanged={state.onChanged} />
      {snapshot.phase === "open" && <ClosePanel close={actions.close} />}
    </div>
  );
}

// While a ticket waits for a decision nobody spins (RF-51); another administrator sees who is spinning (RF-50).
function BusyNotice({ pending, onTakeOver }: Readonly<{ pending: PendingDraw; onTakeOver: (id: string) => void }>) {
  return (
    <div role="status" className="grid justify-items-start gap-2 border border-border p-4">
      <p className="m-0 font-bold">{COPY.spin.busy}</p>
      <p className="m-0 text-sm text-muted">{COPY.spin.busyDetail(pending.ticketNumber, pending.drawnByName)}</p>
      <Button variant="tertiary" className="min-h-11" onPress={() => onTakeOver(pending.id)}>
        {COPY.spin.takeOver}
      </Button>
    </div>
  );
}

function ClosePanel({ close }: Readonly<{ close: RaffleAction }>) {
  return (
    <section aria-labelledby="raffle-close-heading" className="grid justify-items-start gap-3">
      <h2 id="raffle-close-heading" className="type-section">
        {COPY.close.heading}
      </h2>
      <p className="m-0 text-sm text-muted">{COPY.close.hint}</p>
      <ConfirmActionForm
        action={close}
        field={{ name: "confirm", value: "close" }}
        labels={{
          trigger: COPY.close.trigger,
          prompt: COPY.close.prompt,
          confirm: COPY.close.confirm,
          cancel: COPY.close.cancel,
        }}
      />
    </section>
  );
}
