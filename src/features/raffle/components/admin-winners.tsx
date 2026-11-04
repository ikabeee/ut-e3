"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useActionState, useEffect } from "react";
import type { RaffleAction } from "@features/raffle/components/draw-decision-dialog";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { MAX_PRIZE_NAME } from "@features/raffle/lib/raffle-input";
import type { AdminWinner } from "@features/raffle/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface AdminWinnersProps {
  winners: AdminWinner[];
  registerPrize: RaffleAction;
  onChanged: () => void;
}

const COPY = RAFFLE_COPY.admin.winners;

/** The panel of winners (RF-55): any raffle administrator registers the prize when it is handed over. */
export function AdminWinners({ winners, registerPrize, onChanged }: Readonly<AdminWinnersProps>) {
  return (
    <section aria-labelledby="raffle-winners-heading" className="grid gap-4">
      <h2 id="raffle-winners-heading" className="type-section">
        {COPY.heading}
      </h2>
      {winners.length === 0 ? (
        <p className="m-0 text-muted">{COPY.empty}</p>
      ) : (
        <ol className="grid gap-3">
          {winners.map((winner) => (
            <WinnerRow key={winner.drawId} winner={winner} registerPrize={registerPrize} onChanged={onChanged} />
          ))}
        </ol>
      )}
    </section>
  );
}

interface WinnerRowProps {
  winner: AdminWinner;
  registerPrize: RaffleAction;
  onChanged: () => void;
}

function WinnerRow({ winner, registerPrize, onChanged }: Readonly<WinnerRowProps>) {
  return (
    <li className="grid gap-3 border border-border bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span className="type-mono text-lg">
          {RAFFLE_COPY.ticket(winner.ticketNumber)} · {winner.gamertag}
        </span>
        <span className="text-sm text-muted">{COPY.decidedAt(formatTimeOfDay(winner.decidedAt))}</span>
      </div>
      {winner.prizeName ? (
        <p className="m-0 text-sm">{COPY.prizeRegistered(winner.prizeName, winner.prizeByName ?? "")}</p>
      ) : (
        <PrizeForm drawId={winner.drawId} registerPrize={registerPrize} onChanged={onChanged} />
      )}
    </li>
  );
}

interface PrizeFormProps {
  drawId: string;
  registerPrize: RaffleAction;
  onChanged: () => void;
}

function PrizeForm({ drawId, registerPrize, onChanged }: Readonly<PrizeFormProps>) {
  const [state, formAction, isPending] = useActionState(registerPrize, null);

  useEffect(() => {
    if (state?.status === "done") onChanged();
  }, [state, onChanged]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="drawId" value={drawId} />
      <TextField name="prizeName" isRequired className="grid min-w-0 flex-1 basis-56 gap-1">
        <Label>{COPY.prizeLabel}</Label>
        <Input className="min-h-11 text-base" maxLength={MAX_PRIZE_NAME} autoComplete="off" />
      </TextField>
      <Button type="submit" variant="outline" className="min-h-11" isPending={isPending}>
        {isPending ? COPY.prizePending : COPY.prizeSubmit}
      </Button>
      {state?.status === "error" && (
        <p role="alert" className="m-0 basis-full text-sm text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
