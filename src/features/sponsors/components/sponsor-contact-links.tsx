import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import { formatPhone } from "@features/sponsors/lib/phone-format";
import type { Sponsor } from "@features/sponsors/lib/types";
import { ActionLink } from "@shared/components/action-link";

interface SponsorContactLinksProps {
  sponsor: Pick<Sponsor, "websiteUrl" | "phone">;
}

export function SponsorContactLinks({ sponsor }: Readonly<SponsorContactLinksProps>) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <ActionLink href={sponsor.websiteUrl} arrow="ne" isExternal>
        {SPONSORS_COPY.website}
      </ActionLink>
      <a href={`tel:${sponsor.phone}`} className="inline-flex min-h-11 items-center type-mono text-copy underline">
        {formatPhone(sponsor.phone)}
      </a>
    </div>
  );
}
