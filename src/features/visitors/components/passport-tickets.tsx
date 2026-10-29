import type { PassportTicket } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface PassportTicketsProps {
  tickets: PassportTicket[];
}

const COPY = VISITORS_COPY.passport.tickets;

export function PassportTickets({ tickets }: Readonly<PassportTicketsProps>) {
  return (
    <section className="flex w-full max-w-sm flex-col gap-3">
      <h2 className="type-tiny text-foreground">{COPY.title}</h2>

      {tickets.length === 0 ? (
        <p className="type-tiny text-muted">{COPY.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <li
              key={ticket.number}
              className="flex items-baseline justify-between gap-4 border border-border bg-surface p-3"
            >
              <span className="type-mono text-foreground">{COPY.ticket(ticket.number)}</span>
              <span className="type-tiny text-muted">{COPY.milestone(ticket.milestone)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
