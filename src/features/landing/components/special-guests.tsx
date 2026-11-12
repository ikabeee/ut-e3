import { GuestCarousel } from "@features/landing/components/guest-carousel";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { GUESTS_SECTION_ID } from "@features/landing/lib/landing-links";
import type { SpecialGuest } from "@features/landing/lib/types";

interface SpecialGuestsProps {
  guests: readonly SpecialGuest[];
}

/** Phones: heading, badge and controls. From 820px: heading and controls on the left, the badge on the right. */
export function SpecialGuests({ guests }: Readonly<SpecialGuestsProps>) {
  return (
    <section id={GUESTS_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <div className="grid gap-y-[clamp(28px,4vw,48px)] min-[820px]:grid-cols-12 min-[820px]:gap-x-gutter">
          <h2 className="type-giant min-[820px]:col-span-5 min-[820px]:self-end min-[820px]:text-[clamp(32px,4vw,60px)]">
            {LANDING_COPY.guests.heading}
          </h2>
          <GuestCarousel guests={guests} />
        </div>
      </div>
    </section>
  );
}
