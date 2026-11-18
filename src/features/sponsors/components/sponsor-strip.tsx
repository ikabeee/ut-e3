"use client";

import { cn } from "@heroui/react";
import { useRef } from "react";
import { SponsorTicket } from "@features/sponsors/components/sponsor-ticket";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";

interface SponsorStripProps {
  sponsors: Sponsor[];
  className?: string;
}

// A step moves most of the visible width, so the ticket that was cut at the edge comes in whole.
const STEP_RATIO = 0.8;

// The perforation between two sponsors: a dashed edge with a half notch punched at the top and at the bottom. The
// track clips the notches, which leaves them as bites out of the strip.
const PERFORATION =
  "relative not-first:-ml-px not-first:border-l-2 not-first:border-dashed not-first:border-border not-first:before:absolute not-first:before:top-0 not-first:before:left-0 not-first:before:z-10 not-first:before:size-4.5 not-first:before:-translate-x-1/2 not-first:before:-translate-y-1/2 not-first:before:rounded-full not-first:before:border not-first:before:border-border not-first:before:bg-background not-first:after:absolute not-first:after:bottom-0 not-first:after:left-0 not-first:after:z-10 not-first:after:size-4.5 not-first:after:-translate-x-1/2 not-first:after:translate-y-1/2 not-first:after:rounded-full not-first:after:border not-first:after:border-border not-first:after:bg-background";

/**
 * The raffle tickets of the sponsors as one long strip, like a fair ticket: they sit side by side and scroll sideways
 * with a swipe (the browser snaps to each ticket) or with the previous and next controls, which wrap around at the ends.
 */
export function SponsorStrip({ sponsors, className }: Readonly<SponsorStripProps>) {
  const trackRef = useRef<HTMLUListElement>(null);

  function step(direction: -1 | 1) {
    const track = trackRef.current;

    if (track === null) return;

    const maxScroll = track.scrollWidth - track.clientWidth;

    if (direction === 1 && track.scrollLeft >= maxScroll - 1) {
      track.scrollTo({ left: 0 });
    } else if (direction === -1 && track.scrollLeft <= 1) {
      track.scrollTo({ left: maxScroll });
    } else {
      track.scrollBy({ left: direction * track.clientWidth * STEP_RATIO });
    }
  }

  return (
    <div className={className}>
      <ul
        ref={trackRef}
        aria-label={SPONSORS_COPY.page.listLabel}
        className="m-0 scrollbar-none flex snap-x snap-mandatory list-none overflow-x-auto overscroll-x-contain scroll-smooth p-0 motion-reduce:scroll-auto"
      >
        {sponsors.map((sponsor, index) => (
          <li
            key={sponsor.id}
            className={cn("@container w-[min(88%,440px)] shrink-0 snap-start min-[900px]:w-[420px]", PERFORATION)}
          >
            <SponsorTicket sponsor={sponsor} order={index + 1} className="hover:translate-none hover:rotate-none" />
          </li>
        ))}
      </ul>
      {sponsors.length > 1 && <StripControls onStep={step} />}
    </div>
  );
}

function StripControls({ onStep }: Readonly<{ onStep: (direction: -1 | 1) => void }>) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <ArrowButton
        direction="previous"
        variant="outline"
        label={SPONSORS_COPY.strip.previous}
        onPress={() => onStep(-1)}
      />
      <ArrowButton direction="next" variant="outline" label={SPONSORS_COPY.strip.next} onPress={() => onStep(1)} />
    </div>
  );
}
