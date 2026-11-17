import { RaffleTicketIcon } from "@features/raffle/components/raffle-ticket-icon";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { RAFFLE_LIVE_PATH } from "@features/raffle/lib/raffle-links";
import { ActionLink } from "@shared/components/action-link";

const COPY = RAFFLE_COPY.winners;

/** The centered top of /raffle: the ticket emblem, the title, what the page shows and the way to the live drum. */
export function RaffleWinnersHeader() {
  return (
    <header className="grid justify-items-center gap-4 text-center">
      <RaffleTicketIcon className="text-accent" />
      <h1 className="m-0 type-section text-balance">{COPY.title}</h1>
      <p className="m-0 max-w-prose text-pretty text-muted">{COPY.description}</p>
      <ActionLink href={RAFFLE_LIVE_PATH} variant="outline">
        {COPY.liveLink}
      </ActionLink>
    </header>
  );
}
