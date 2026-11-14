"use client";

import { GuestBadgeStage } from "@features/landing/components/guest-badge-stage";
import { useGuestCarousel } from "@features/landing/hooks/use-guest-carousel";
import { useVisibleOnce } from "@features/landing/hooks/use-visible-once";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import type { SpecialGuest } from "@features/landing/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";

/** The badge drops once a fifth of the section is already on screen, so the visitor sees it fall. */
const DROP_MARGIN = "0px 0px -20% 0px";

interface GuestCarouselProps {
  guests: readonly SpecialGuest[];
}

/** One badge at a time. Renders two cells of the parent grid: the badge and, with two guests or more, the controls. */
export function GuestCarousel({ guests }: Readonly<GuestCarouselProps>) {
  const carousel = useGuestCarousel(guests.length);
  const [stageRef, hasBeenSeen] = useVisibleOnce<HTMLDivElement>(DROP_MARGIN);
  const guest = guests[carousel.index];

  if (!guest) return null;

  return (
    <>
      <GuestBadgeStage
        ref={stageRef}
        guest={guest}
        swing={{ ...carousel, hasBeenSeen }}
        className="min-[820px]:col-span-7 min-[820px]:col-start-6 min-[820px]:row-span-2 min-[820px]:row-start-1"
      />
      {guests.length > 1 ? (
        <GuestCarouselControls
          current={carousel.index + 1}
          total={guests.length}
          onPrevious={carousel.goPrevious}
          onNext={carousel.goNext}
        />
      ) : null}
    </>
  );
}

interface GuestCarouselControlsProps {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

function GuestCarouselControls({ current, total, onPrevious, onNext }: Readonly<GuestCarouselControlsProps>) {
  return (
    <div className="flex items-center justify-center gap-4 min-[820px]:col-span-5 min-[820px]:row-start-2 min-[820px]:justify-start min-[820px]:self-start">
      <ArrowButton direction="previous" label={LANDING_COPY.guests.previous} onPress={onPrevious} />
      <p aria-live="polite" className="m-0 type-mono">
        {LANDING_COPY.guests.counter(current, total)}
      </p>
      <ArrowButton direction="next" label={LANDING_COPY.guests.next} onPress={onNext} />
    </div>
  );
}
