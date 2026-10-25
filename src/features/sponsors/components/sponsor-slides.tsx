import Image from "next/image";
import { cn } from "@heroui/react";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorSlidesProps {
  sponsors: Sponsor[];
  current: number;
}

export function SponsorSlides({ sponsors, current }: Readonly<SponsorSlidesProps>) {
  return (
    <div className="relative min-h-0 flex-1 max-[760px]:h-56 max-[760px]:flex-none">
      {sponsors.map((sponsor, index) => (
        <SponsorSlide key={sponsor.id} sponsor={sponsor} isCurrent={index === current} />
      ))}
    </div>
  );
}

interface SponsorSlideProps {
  sponsor: Sponsor;
  isCurrent: boolean;
}

function SponsorSlide({ sponsor, isCurrent }: Readonly<SponsorSlideProps>) {
  return (
    <div
      role="group"
      aria-roledescription={SPONSORS_COPY.slideRoleDescription}
      aria-label={sponsor.name}
      className={cn(
        "absolute inset-0 p-gutter",
        isCurrent
          ? "visible opacity-100 transition-opacity duration-700"
          : "invisible opacity-0 transition-[opacity,visibility] delay-0 duration-700",
      )}
    >
      <div className="relative size-full">
        <Image
          src={sponsor.logoPath}
          alt={sponsor.name}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}
