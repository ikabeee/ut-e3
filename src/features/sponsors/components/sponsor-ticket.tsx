import { BalancedLogo } from "@features/sponsors/components/balanced-logo";
import { SponsorContactLinks } from "@features/sponsors/components/sponsor-contact-links";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorTicketProps {
  sponsor: Sponsor;
  order: number;
}

// Reads bottom to top, like the stub of a printed ticket.
const VERTICAL_TEXT = "rotate-180 [writing-mode:vertical-rl]";

/**
 * A horizontal raffle ticket: the numbered stub, the perforation and the body with the logo, name and contact. The
 * `@min-[420px]` sizes answer to the width of the ticket (its list item is the container), not to the viewport: two
 * columns on a tablet are as narrow as one on a phone.
 */
export function SponsorTicket({ sponsor, order }: Readonly<SponsorTicketProps>) {
  return (
    <article className="flex h-full overflow-hidden border border-border bg-background transition-transform duration-200 hover:-translate-y-1 hover:rotate-[-0.6deg] motion-reduce:transition-none motion-reduce:hover:translate-none motion-reduce:hover:rotate-none">
      <TicketStub order={order} />
      <TicketPerforation />
      <div className="flex min-w-0 flex-1 items-center gap-3 p-3 @min-[420px]:gap-4 @min-[420px]:p-4">
        <BalancedLogo src={sponsor.logoPath} alt={sponsor.name} />
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="type-wide text-[11px] leading-[1.15] wrap-break-word @min-[420px]:text-[13px]">
            {sponsor.name}
          </h3>
          <SponsorContactLinks sponsor={sponsor} className="flex-col items-start gap-y-0" isCompact />
        </div>
      </div>
    </article>
  );
}

function TicketStub({ order }: Readonly<{ order: number }>) {
  return (
    <div className="flex w-15 shrink-0 flex-col items-center justify-between gap-3 bg-[repeating-linear-gradient(135deg,#111111_0_6px,#000000_6px_12px)] py-3 @min-[420px]:w-21">
      <span className={`${VERTICAL_TEXT} type-tiny text-muted`}>{SPONSORS_COPY.tickets.stubLabel}</span>
      <span
        className={`${VERTICAL_TEXT} font-mono text-[18px] leading-none font-medium text-accent uppercase @min-[420px]:text-[22px]`}
      >
        {SPONSORS_COPY.tickets.number(order)}
      </span>
    </div>
  );
}

function TicketPerforation() {
  const notch = "absolute left-1/2 size-4.5 -translate-x-1/2 rounded-full border border-border bg-background";

  return (
    <div aria-hidden="true" className="relative shrink-0 border-l-2 border-dashed border-border">
      <span className={`${notch} -top-2.25`} />
      <span className={`${notch} -bottom-2.25`} />
    </div>
  );
}
