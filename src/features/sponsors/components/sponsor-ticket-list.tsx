import { cn } from "@heroui/react";
import { SponsorTicket } from "@features/sponsors/components/sponsor-ticket";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorTicketListProps {
  sponsors: Sponsor[];
  className?: string;
}

/** The raffle tickets of the sponsors, numbered by the order they arrive in: the landing and /sponsors share it. */
export function SponsorTicketList({ sponsors, className }: Readonly<SponsorTicketListProps>) {
  return (
    <ul
      aria-label={SPONSORS_COPY.page.listLabel}
      className={cn(
        "m-0 grid list-none grid-cols-1 gap-4 p-0 min-[760px]:grid-cols-2 min-[760px]:gap-6 min-[1200px]:grid-cols-3",
        className,
      )}
    >
      {sponsors.map((sponsor, index) => (
        <li key={sponsor.id} className="@container">
          <SponsorTicket sponsor={sponsor} order={index + 1} />
        </li>
      ))}
    </ul>
  );
}
