import Image from "next/image";
import { cn } from "@heroui/react";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorsBandProps {
  sponsors: Sponsor[];
}

export function SponsorsBand({ sponsors }: Readonly<SponsorsBandProps>) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-border bg-background py-6">
      <div className="page-wrap">
        <h2 className="type-tiny text-accent">{SPONSORS_COPY.heading}</h2>
      </div>
      <div className="group mt-4 overflow-hidden border-t border-border motion-reduce:overflow-x-auto">
        <div className="flex w-max animate-marquee group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none">
          <SponsorGroup sponsors={sponsors} isDuplicate={false} />
          <SponsorGroup sponsors={sponsors} isDuplicate />
        </div>
      </div>
    </section>
  );
}

function SponsorGroup({ sponsors, isDuplicate }: Readonly<SponsorsBandProps & { isDuplicate: boolean }>) {
  return (
    <ul
      aria-hidden={isDuplicate || undefined}
      className={cn(
        "m-0 flex min-w-full shrink-0 list-none items-center justify-around p-0",
        isDuplicate && "motion-reduce:hidden",
      )}
    >
      {sponsors.map((sponsor) => (
        <li key={sponsor.id}>
          <SponsorLink sponsor={sponsor} isDuplicate={isDuplicate} />
        </li>
      ))}
    </ul>
  );
}

function SponsorLink({ sponsor, isDuplicate }: Readonly<{ sponsor: Sponsor; isDuplicate: boolean }>) {
  return (
    <a
      href={sponsor.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={isDuplicate ? -1 : undefined}
      className="flex min-h-11 items-center gap-4 px-8 py-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
    >
      <span className="relative block h-10 w-28">
        <Image
          src={sponsor.logoPath}
          alt={isDuplicate ? "" : sponsor.name}
          fill
          sizes="112px"
          className="object-contain"
        />
      </span>
      <span className="type-tiny text-muted">{sponsor.name}</span>
    </a>
  );
}
