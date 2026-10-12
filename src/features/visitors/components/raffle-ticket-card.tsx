import { formatTicketNumber } from "@features/visitors/lib/passport";
import type { RaffleTicket } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface RaffleTicketCardProps {
  ticket: RaffleTicket;
}

/** Boleto del sorteo; si ya ganó, le indica presentarse en el main stage. */
export function RaffleTicketCard({ ticket }: Readonly<RaffleTicketCardProps>) {
  const copy = VISITORS_COPY.raffle;

  return (
    <div className="flex flex-col gap-2 border border-accent p-[clamp(16px,2.4vw,24px)]">
      <span className="type-tiny text-muted">{copy.ticketKicker}</span>
      <b className="font-wide text-[clamp(40px,7vw,72px)] leading-none tracking-[-.04em] text-accent">
        {formatTicketNumber(ticket.ticketNumber)}
      </b>
      <p className="m-0 text-[15px] leading-[1.35] text-copy-strong">
        {ticket.wonAt ? copy.winner : copy.participating}
      </p>
    </div>
  );
}
