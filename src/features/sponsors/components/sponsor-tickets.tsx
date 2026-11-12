import { SponsorTicket } from "@features/sponsors/components/sponsor-ticket";
import { SPONSORS_SECTION_ID } from "@features/sponsors/lib/sponsors-links";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorTicketsProps {
  sponsors: Sponsor[];
}

const HEADING_ID = "sponsors-heading";

/** The sponsors of the landing and /showcase, one raffle ticket each, in the order they arrive (by position). */
export function SponsorTickets({ sponsors }: Readonly<SponsorTicketsProps>) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section id={SPONSORS_SECTION_ID} aria-labelledby={HEADING_ID} className="bg-background section-block">
      <div className="page-wrap">
        <h2 id={HEADING_ID} className="type-giant">
          {SPONSORS_COPY.heading}
        </h2>
        <p className="mt-4 text-[17px] text-muted min-[761px]:text-xl">{SPONSORS_COPY.tickets.lead}</p>
        <ul
          aria-label={SPONSORS_COPY.page.listLabel}
          className="m-0 mt-[clamp(36px,5vw,64px)] grid list-none grid-cols-1 gap-4 p-0 min-[760px]:grid-cols-2 min-[760px]:gap-6 min-[1200px]:grid-cols-3"
        >
          {sponsors.map((sponsor, index) => (
            <li key={sponsor.id} className="@container">
              <SponsorTicket sponsor={sponsor} order={index + 1} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
