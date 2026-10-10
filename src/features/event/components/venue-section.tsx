import { CopyAddressButton } from "@features/event/components/copy-address-button";
import { VenueMap } from "@features/event/components/venue-map";
import { EVENT_VENUE } from "@features/event/lib/event-info";
import { ActionLink } from "@shared/components/action-link";
import { PaperCard } from "@shared/components/paper-card";

/** "Ubicación": sede, dirección, acciones y esquema (`#ubicacion`). */
export function VenueSection() {
  return (
    <section id="ubicacion" className="section-block">
      <div className="page-wrap">
        <p className="type-tiny mb-[18px]">{EVENT_VENUE.landmark}</p>
        <h2 className="type-giant">Ubicación</h2>
        <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-[.85fr_1.15fr] gap-gutter max-[860px]:grid-cols-1">
          <article className="flex min-w-0 flex-col">
            <PaperCard className="flex-1 gap-3 px-[22px] pt-[22px] pb-7">
              <span className="type-tiny">Sede</span>
              <h3 className="font-wide text-[clamp(22px,2.8vw,38px)] leading-[.95] font-bold tracking-[-.03em] uppercase">
                {EVENT_VENUE.name}
              </h3>
              <p className="m-0 max-w-[40ch] text-lg leading-[1.2]">{EVENT_VENUE.address}</p>
            </PaperCard>
            <div className="flex flex-wrap justify-end">
              <CopyAddressButton address={EVENT_VENUE.copyableAddress} />
              <ActionLink href={EVENT_VENUE.mapsUrl} variant="primary" size="lg" arrow="ne" isExternal>
                Abrir en Google Maps
              </ActionLink>
            </div>
          </article>
          <div className="min-w-0 overflow-hidden border border-border bg-background">
            <VenueMap />
          </div>
        </div>
      </div>
    </section>
  );
}
