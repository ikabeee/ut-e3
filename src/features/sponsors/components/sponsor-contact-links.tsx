import { cn } from "@heroui/react";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import { formatPhone } from "@features/sponsors/lib/phone-format";
import type { Sponsor } from "@features/sponsors/lib/types";
import { ActionLink } from "@shared/components/action-link";

interface SponsorContactLinksProps {
  sponsor: Pick<Sponsor, "websiteUrl" | "phone" | "email">;
  // Adjusts the row of links, for example to stack them in a narrow ticket.
  className?: string;
}

export function SponsorContactLinks({ sponsor, className }: Readonly<SponsorContactLinksProps>) {
  const hasWebsite = sponsor.websiteUrl !== "";
  const hasPhone = sponsor.phone !== "";
  const hasEmail = sponsor.email !== null && sponsor.email !== "";

  if (!hasWebsite && !hasPhone && !hasEmail) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      {hasWebsite ? (
        <ActionLink href={sponsor.websiteUrl} arrow="ne" isExternal>
          {SPONSORS_COPY.website}
        </ActionLink>
      ) : null}
      {hasPhone ? (
        <a href={`tel:${sponsor.phone}`} className="inline-flex min-h-11 items-center type-mono text-copy underline">
          {formatPhone(sponsor.phone)}
        </a>
      ) : null}
      {hasEmail ? (
        <a
          href={`mailto:${sponsor.email}`}
          className="inline-flex min-h-11 items-center type-mono wrap-anywhere text-copy underline"
        >
          {sponsor.email}
        </a>
      ) : null}
    </div>
  );
}
