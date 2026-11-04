import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import type { RaffleAdminSnapshot } from "@features/raffle/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface RaffleStatusProps {
  snapshot: RaffleAdminSnapshot;
}

const COPY = RAFFLE_COPY.admin.status;

export function RaffleStatus({ snapshot }: Readonly<RaffleStatusProps>) {
  return (
    <section aria-labelledby="raffle-status-heading" className="grid gap-2">
      <h2 id="raffle-status-heading" className="type-tiny text-muted">
        {COPY.heading}
      </h2>
      <p className="m-0 text-lg">{describePhase(snapshot)}</p>
      <ul className="flex flex-wrap gap-x-6 gap-y-1 type-mono text-sm">
        <li>{COPY.activeTickets(snapshot.activeTickets)}</li>
        <li>{COPY.winners(snapshot.winners.length)}</li>
        <li>{COPY.discarded(snapshot.discardedCount)}</li>
      </ul>
    </section>
  );
}

function describePhase({ phase, startsAt, closedAt }: RaffleAdminSnapshot): string {
  if (phase === "upcoming") return COPY.upcoming(formatTimeOfDay(startsAt));

  return phase === "closed" && closedAt ? COPY.closed(formatTimeOfDay(closedAt)) : COPY.open;
}
