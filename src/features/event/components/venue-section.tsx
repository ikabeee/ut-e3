import { CopyAddressButton } from "@features/event/components/copy-address-button";
import { VenueMap } from "@features/event/components/venue-map";
import { EVENT_COPY } from "@features/event/lib/event-copy";
import { formatCopyableAddress, formatVenueAddress } from "@features/event/lib/event-format";
import type { EventVenue } from "@features/event/lib/types";
import { ActionLink } from "@shared/components/action-link";
import { PaperCard } from "@shared/components/paper-card";

interface VenueSectionProps {
  venue: EventVenue;
}

/** "Ubicación": sede, dirección, acciones y esquema (`#venue`). */
export function VenueSection({ venue }: Readonly<VenueSectionProps>) {
  return (
    <section id="venue" className="section-block">
      <div className="page-wrap">
        <p className="type-tiny mb-[18px]">{venue.landmark}</p>
        <h2 className="type-giant">{EVENT_COPY.venue.heading}</h2>
        <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-[.85fr_1.15fr] gap-gutter max-[860px]:grid-cols-1">
          <article className="flex min-w-0 flex-col">
            <PaperCard className="flex-1 gap-3 px-[22px] pt-[22px] pb-7">
              <span className="type-tiny">{EVENT_COPY.venue.kicker}</span>
              <h3 className="font-wide text-[clamp(22px,2.8vw,38px)] leading-[.95] font-bold tracking-[-.03em] uppercase">
                {venue.name}
              </h3>
              <p className="m-0 max-w-[40ch] text-lg leading-[1.2]">{formatVenueAddress(venue)}</p>
            </PaperCard>
            <div className="flex flex-wrap justify-end">
              <CopyAddressButton address={formatCopyableAddress(venue)} />
              <ActionLink href={venue.mapsUrl} variant="primary" size="lg" arrow="ne" isExternal>
                {EVENT_COPY.venue.openMaps}
              </ActionLink>
            </div>
          </article>
          <div className="min-w-0 overflow-hidden border border-border bg-background">
            <VenueMap venueShortName={venue.shortName} landmark={venue.landmark} />
          </div>
        </div>
      </div>
    </section>
  );
}
