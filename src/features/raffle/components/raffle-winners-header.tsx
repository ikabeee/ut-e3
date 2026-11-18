import { RaffleTicketIcon } from "@features/raffle/components/raffle-ticket-icon";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { RAFFLE_LIVE_PATH } from "@features/raffle/lib/raffle-links";
import { ActionLink } from "@shared/components/action-link";

const COPY = RAFFLE_COPY.winners;

interface RaffleWinnersHeaderProps {
  /** When the raffle starts: the instant of `event_settings` and its date and hour in America/Cancun. */
  raffleStart: { at: string; label: string };
}

/**
 * The centered top of /raffle: the ticket emblem, the title, what the page shows, when the raffle starts (S5) and the
 * way to the live drum.
 */
export function RaffleWinnersHeader({ raffleStart }: Readonly<RaffleWinnersHeaderProps>) {
  return (
    <header className="grid justify-items-center gap-4 text-center">
      <RaffleTicketIcon className="text-accent" />
      <h1 className="m-0 type-section text-balance">{COPY.title}</h1>
      <p className="m-0 max-w-prose text-pretty text-muted">{COPY.description}</p>
      <p className="m-0 grid gap-1">
        <span className="type-tiny text-muted">{COPY.startsAt.label}</span>{" "}
        <time dateTime={raffleStart.at} className="type-mono text-lg font-bold text-foreground">
          {raffleStart.label}
        </time>
      </p>
      <ActionLink href={RAFFLE_LIVE_PATH} variant="outline">
        {COPY.liveLink}
      </ActionLink>
    </header>
  );
}
