"use client";

import Image from "next/image";
import { GuestBadgeStage } from "@features/landing/components/guest-badge-stage";
import { useBadgeSwipe } from "@features/landing/hooks/use-badge-swipe";
import { useGuestCarousel } from "@features/landing/hooks/use-guest-carousel";
import { useVisibleOnce } from "@features/landing/hooks/use-visible-once";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { GUEST_PHOTO_SIZES, getNeighborGuests } from "@features/landing/lib/special-guests";
import type { SpecialGuest } from "@features/landing/lib/types";

/** The badge drops once a fifth of the section is already on screen, so the visitor sees it fall. */
const DROP_MARGIN = "0px 0px -20% 0px";

/** The photos of the neighbor badges are requested when the carousel is this close to the screen. */
const PREFETCH_MARGIN = "600px 0px";

/** The badge is focusable and named, so the keyboard and assistive technology can reach the same moves. */
const CAROUSEL_ATTRIBUTES = {
  tabIndex: 0,
  role: "group",
  "aria-roledescription": "carrusel",
  "aria-label": LANDING_COPY.guests.carouselLabel,
} as const;

interface GuestCarouselProps {
  guests: readonly SpecialGuest[];
}

/**
 * One badge at a time. Renders one cell of the parent grid: the badge, which is also the control: swipe or tap it,
 * or focus it and use the arrow keys. With two guests or more, a hidden live region announces the badge that is shown.
 */
export function GuestCarousel({ guests }: Readonly<GuestCarouselProps>) {
  const carousel = useGuestCarousel(guests.length);
  const swipe = useBadgeSwipe({ onPrevious: carousel.goPrevious, onNext: carousel.goNext });
  const [stageRef, hasBeenSeen] = useVisibleOnce<HTMLDivElement>(DROP_MARGIN);
  const [carouselRef, isNear] = useVisibleOnce<HTMLDivElement>(PREFETCH_MARGIN);
  const guest = guests[carousel.index];

  if (!guest) return null;

  const hasSeveralGuests = guests.length > 1;

  return (
    <div ref={carouselRef} className="relative min-[820px]:col-span-7 min-[820px]:col-start-6">
      <GuestBadgeStage
        ref={stageRef}
        guest={guest}
        swing={{ ...carousel, hasBeenSeen }}
        gestures={hasSeveralGuests ? { ...swipe, ...CAROUSEL_ATTRIBUTES } : undefined}
        className="w-full"
      />
      {hasSeveralGuests ? (
        <p aria-live="polite" className="sr-only">
          {LANDING_COPY.guests.announcement(carousel.index + 1, guests.length, guest.name)}
        </p>
      ) : null}
      {isNear ? <NeighborPhotos guests={getNeighborGuests(guests, carousel.index)} /> : null}
    </div>
  );
}

/** Loads, out of sight, the photos of the badges one move away, so the next badge does not wait for its photo. */
function NeighborPhotos({ guests }: Readonly<{ guests: readonly SpecialGuest[] }>) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute size-px overflow-hidden opacity-0">
      {guests.map((guest) =>
        guest.photo ? (
          <Image
            key={guest.id}
            src={guest.photo.src}
            alt=""
            width={720}
            height={900}
            sizes={GUEST_PHOTO_SIZES}
            loading="eager"
            fetchPriority="low"
          />
        ) : null,
      )}
    </div>
  );
}
