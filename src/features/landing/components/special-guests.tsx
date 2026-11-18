import { GuestCarousel } from "@features/landing/components/guest-carousel";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { GUESTS_SECTION_ID } from "@features/landing/lib/landing-links";
import type { SpecialGuest } from "@features/landing/lib/types";

interface SpecialGuestsProps {
  guests: readonly SpecialGuest[];
}

/**
 * Phones: heading and badge. From 820px: the heading on the left, the badge on the right. The badge is the control
 * (swipe, tap or arrow keys); there is no pager.
 */
export function SpecialGuests({ guests }: Readonly<SpecialGuestsProps>) {
  return (
    <section id={GUESTS_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <div className="grid gap-y-[clamp(28px,4vw,48px)] min-[820px]:grid-cols-12 min-[820px]:gap-x-gutter">
          <h2 className="type-giant text-[clamp(24px,4.6vw,68px)] min-[820px]:col-span-5 min-[820px]:self-end">
            {LANDING_COPY.guests.heading}
          </h2>
          <GuestCarousel guests={guests} />
        </div>
      </div>
    </section>
  );
}
