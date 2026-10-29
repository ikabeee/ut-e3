import { SponsorCard } from "@features/sponsors/components/sponsor-card";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorCardsProps {
  sponsors: Sponsor[];
}

export function SponsorCards({ sponsors }: Readonly<SponsorCardsProps>) {
  return (
    <ul
      aria-label={SPONSORS_COPY.page.listLabel}
      className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[760px]:grid-cols-2 min-[760px]:gap-6 min-[1200px]:grid-cols-3"
    >
      {sponsors.map((sponsor) => (
        <li key={sponsor.id}>
          <SponsorCard sponsor={sponsor} />
        </li>
      ))}
    </ul>
  );
}
