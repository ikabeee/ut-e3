import Image from "next/image";
import type { RefObject } from "react";
import { cn } from "@heroui/react";
import { useActiveThumbScroll } from "@shared/hooks/use-active-thumb-scroll";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorThumbnailsProps {
  sponsors: Sponsor[];
  current: number;
  onSelect: (index: number) => void;
  progressBarRef: RefObject<HTMLElement | null>;
}

export function SponsorThumbnails({ sponsors, current, onSelect, progressBarRef }: Readonly<SponsorThumbnailsProps>) {
  const trackRef = useActiveThumbScroll<HTMLDivElement>(current);

  return (
    <div
      ref={trackRef}
      className="scrollbar-none flex min-h-0 flex-1 snap-x snap-mandatory gap-2.5 overflow-x-auto max-[760px]:h-30 max-[760px]:flex-none"
    >
      {sponsors.map((sponsor, index) => (
        <SponsorThumbnail
          key={sponsor.id}
          sponsor={sponsor}
          isCurrent={index === current}
          onSelect={() => onSelect(index)}
          progressBarRef={progressBarRef}
        />
      ))}
    </div>
  );
}

interface SponsorThumbnailProps {
  sponsor: Sponsor;
  isCurrent: boolean;
  onSelect: () => void;
  progressBarRef: RefObject<HTMLElement | null>;
}

function SponsorThumbnail({ sponsor, isCurrent, onSelect, progressBarRef }: Readonly<SponsorThumbnailProps>) {
  return (
    <button
      type="button"
      aria-label={sponsor.name}
      aria-current={isCurrent}
      onClick={onSelect}
      className={cn(
        "group relative aspect-16/10 h-full flex-none cursor-pointer snap-start overflow-hidden border bg-surface p-0 text-left text-foreground",
        isCurrent ? "border-accent" : "border-border",
      )}
    >
      <ThumbnailLogo sponsor={sponsor} isCurrent={isCurrent} />
      <ThumbnailName name={sponsor.name} isCurrent={isCurrent} />
      <i
        ref={isCurrent ? progressBarRef : undefined}
        aria-hidden="true"
        className="absolute top-0 left-0 z-1 h-0.75 bg-accent"
        style={isCurrent ? undefined : { width: 0 }}
      />
    </button>
  );
}

function ThumbnailLogo({ sponsor, isCurrent }: Readonly<{ sponsor: Sponsor; isCurrent: boolean }>) {
  return (
    <span className="absolute inset-x-3 top-3 bottom-8 block">
      <Image
        src={sponsor.logoPath}
        alt=""
        fill
        sizes="200px"
        className={cn(
          "object-contain transition-[filter] duration-300",
          !isCurrent && "brightness-50 grayscale group-hover:brightness-90 group-hover:grayscale-30",
        )}
      />
    </span>
  );
}

function ThumbnailName({ name, isCurrent }: Readonly<{ name: string; isCurrent: boolean }>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-x-2.5 bottom-2.5 z-1 type-wide text-[clamp(10px,.95vw,13px)] leading-[1.1] tracking-[-.02em]",
        isCurrent && "text-accent",
      )}
    >
      {name}
    </span>
  );
}
