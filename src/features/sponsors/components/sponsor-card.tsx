import Image from "next/image";
import { SponsorContactLinks } from "@features/sponsors/components/sponsor-contact-links";
import type { Sponsor } from "@features/sponsors/lib/types";

interface SponsorCardProps {
  sponsor: Sponsor;
}

export function SponsorCard({ sponsor }: Readonly<SponsorCardProps>) {
  return (
    <article className="flex h-full flex-col bg-surface">
      <div className="relative aspect-video">
        <Image
          src={sponsor.logoPath}
          alt={sponsor.name}
          fill
          sizes="(min-width: 1200px) 33vw, (min-width: 760px) 50vw, 100vw"
          className="object-contain p-gutter"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 border-t border-separator px-gutter pt-4 pb-[clamp(20px,3vw,32px)]">
        <h2 className="type-wide text-[clamp(28px,3vw,44px)] leading-[.92] tracking-tighter">{sponsor.name}</h2>
        <p className="m-0 flex-1 text-[clamp(16px,1.3vw,19px)] leading-[1.35] text-copy">{sponsor.services}</p>
        <SponsorContactLinks sponsor={sponsor} />
      </div>
    </article>
  );
}
