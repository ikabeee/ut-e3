"use client";

import Image from "next/image";
import { GuestBadgeStage } from "@features/landing/components/guest-badge-stage";
import { useBadgeSwipe } from "@features/landing/hooks/use-badge-swipe";
import { useGuestCarousel } from "@features/landing/hooks/use-guest-carousel";
import { useVisibleOnce } from "@features/landing/hooks/use-visible-once";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { GUEST_PHOTO_SIZES, getNeighborGuests } from "@features/landing/lib/special-guests";
import type { SpecialGuest } from "@features/landing/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";

/** The badge drops once a fifth of the section is already on screen, so the visitor sees it fall. */
const DROP_MARGIN = "0px 0px -20% 0px";

/** The photos of the neighbor badges are requested when the carousel is this close to the screen. */
const PREFETCH_MARGIN = "600px 0px";

interface LandingGuestCarouselProps {
  guests: readonly SpecialGuest[];
}

/**
 * The carousel of the landing: one badge at a time. Renders one cell of the parent grid: the badge, which is also the control (swipe or tap), and
 * beside it, with two guests or more, a small pager with the same moves for the keyboard and assistive technology.
 */
export function LandingGuestCarousel({ guests }: Readonly<LandingGuestCarouselProps>) {
  const carousel = useGuestCarousel(guests.length);
  const swipe = useBadgeSwipe({ onPrevious: carousel.goPrevious, onNext: carousel.goNext });
  const [stageRef, hasBeenSeen] = useVisibleOnce<HTMLDivElement>(DROP_MARGIN);
  const [carouselRef, isNear] = useVisibleOnce<HTMLDivElement>(PREFETCH_MARGIN);
  const guest = guests[carousel.index];

  if (!guest) return null;

  const hasSeveralGuests = guests.length > 1;

  return (
    <div
      ref={carouselRef}
      className="relative grid items-end justify-items-center gap-4 min-[820px]:col-span-7 min-[820px]:col-start-6 min-[820px]:grid-cols-[minmax(0,1fr)_auto] min-[820px]:justify-items-start"
    >
      <GuestBadgeStage
        ref={stageRef}
        guest={guest}
        swing={{ ...carousel, hasBeenSeen }}
        gestures={hasSeveralGuests ? swipe : undefined}
        isLanding
        className="w-full"
      />
      {hasSeveralGuests ? (
        <GuestPager
          current={carousel.index + 1}
          total={guests.length}
          onPrevious={carousel.goPrevious}
          onNext={carousel.goNext}
        />
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

interface GuestPagerProps {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

/** Subtle: small, dimmed until hovered or focused, with a hint that the badge itself can be moved. */
function GuestPager({ current, total, onPrevious, onNext }: Readonly<GuestPagerProps>) {
  return (
    <div className="flex flex-col items-center gap-1 text-muted opacity-70 transition-opacity focus-within:opacity-100 hover:opacity-100 min-[820px]:items-start min-[820px]:pb-4">
      <div className="flex items-center gap-2">
        <ArrowButton direction="previous" label={LANDING_COPY.guests.previous} size="sm" onPress={onPrevious} />
        <p aria-live="polite" className="m-0 type-tiny">
          {LANDING_COPY.guests.counter(current, total)}
        </p>
        <ArrowButton direction="next" label={LANDING_COPY.guests.next} size="sm" onPress={onNext} />
      </div>
      <p className="m-0 max-w-[26ch] text-center type-tiny normal-case min-[820px]:text-left">
        {LANDING_COPY.guests.hint}
      </p>
    </div>
  );
}
