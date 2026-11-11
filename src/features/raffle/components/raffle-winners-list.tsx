import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { RaffleWinner } from "@features/raffle/lib/types";
import { cn } from "@heroui/react";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface RaffleWinnersListProps {
  winners: RaffleWinner[];
  /** The stage screen uses bigger text than the public page. */
  size?: "page" | "stage";
}

const COPY = RAFFLE_COPY.winners;

/** Confirmed winners with gamertag, prize and hour (RF-56); a prize not handed over yet says so. */
export function RaffleWinnersList({ winners, size = "page" }: Readonly<RaffleWinnersListProps>) {
  if (winners.length === 0) return <p className="m-0 text-muted">{COPY.empty}</p>;

  return (
    <ol className="grid gap-2">
      {winners.map((winner) => (
        <li
          key={winner.drawId}
          className={cn(
            "grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 gap-y-1 border border-border bg-surface p-3",
            size === "stage" && "text-lg",
          )}
        >
          <span className="type-mono text-muted">{RAFFLE_COPY.ticket(winner.ticketNumber)}</span>
          <span className="min-w-0 truncate font-bold">{winner.gamertag}</span>
          <time className="type-mono text-sm text-muted" dateTime={winner.decidedAt}>
            {formatTimeOfDay(winner.decidedAt)}
          </time>
          <span className={cn("col-span-3 text-sm", winner.prizeName ? "text-foreground" : "text-muted")}>
            {winner.prizeName ?? COPY.prizePending}
          </span>
        </li>
      ))}
    </ol>
  );
}
