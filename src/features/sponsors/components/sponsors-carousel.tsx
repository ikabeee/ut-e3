"use client";

import { SponsorCaption } from "@features/sponsors/components/sponsor-caption";
import { SponsorSlides } from "@features/sponsors/components/sponsor-slides";
import { SponsorThumbnails } from "@features/sponsors/components/sponsor-thumbnails";
import { SPONSORS_SECTION_ID } from "@features/sponsors/lib/sponsors-links";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";
import { useAutoplayCarousel } from "@shared/hooks/use-autoplay-carousel";

interface SponsorsCarouselProps {
  sponsors: Sponsor[];
}

export function SponsorsCarousel({ sponsors }: Readonly<SponsorsCarouselProps>) {
  if (sponsors.length === 0) {
    return null;
  }

  return <Carousel sponsors={sponsors} />;
}

function Carousel({ sponsors }: Readonly<SponsorsCarouselProps>) {
  const carousel = useAutoplayCarousel(sponsors.length);

  return (
    <section
      id={SPONSORS_SECTION_ID}
      aria-roledescription={SPONSORS_COPY.roleDescription}
      aria-label={SPONSORS_COPY.heading}
      className="grid grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto] bg-background"
      {...carousel.pauseHandlers}
    >
      <div className="flex flex-col bg-surface" {...carousel.swipeHandlers}>
        <SponsorSlides sponsors={sponsors} current={carousel.current} />
        <SponsorCaption sponsor={sponsors[carousel.current]} />
      </div>

      <div className="flex min-w-0 flex-col items-center gap-2.5 border-t border-separator px-gutter pt-3.5 pb-4">
        <SponsorThumbnails
          sponsors={sponsors}
          current={carousel.current}
          onSelect={carousel.goTo}
          progressBarRef={carousel.progressBarRef}
        />
        <div className="flex justify-center [&>*+*]:border-l-0">
          <ArrowButton direction="previous" label={SPONSORS_COPY.previous} onPress={carousel.goPrevious} />
          <ArrowButton direction="next" label={SPONSORS_COPY.next} onPress={carousel.goNext} />
        </div>
      </div>
    </section>
  );
}
