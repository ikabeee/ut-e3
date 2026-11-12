import { cn } from "@heroui/react";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import { formatPhone } from "@features/sponsors/lib/phone-format";
import type { Sponsor } from "@features/sponsors/lib/types";
import { ActionLink } from "@shared/components/action-link";
import { ArrowGlyph } from "@shared/components/arrow-glyph";

interface SponsorContactLinksProps {
  sponsor: Pick<Sponsor, "websiteUrl" | "phone" | "email">;
  // Adjusts the row of links, for example to stack them in a narrow ticket.
  className?: string;
  // A narrow ticket has no room for the website button, so the website is a text link like the phone.
  isCompact?: boolean;
}

const TEXT_LINK = "inline-flex min-h-11 items-center type-mono text-copy underline";

export function SponsorContactLinks({ sponsor, className, isCompact = false }: Readonly<SponsorContactLinksProps>) {
  const hasWebsite = sponsor.websiteUrl !== "";
  const hasPhone = sponsor.phone !== "";
  const hasEmail = sponsor.email !== null && sponsor.email !== "";

  if (!hasWebsite && !hasPhone && !hasEmail) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}>
      {hasWebsite ? <WebsiteLink href={sponsor.websiteUrl} isCompact={isCompact} /> : null}
      {hasPhone ? (
        <a href={`tel:${sponsor.phone}`} className={TEXT_LINK}>
          {formatPhone(sponsor.phone)}
        </a>
      ) : null}
      {hasEmail ? (
        <a href={`mailto:${sponsor.email}`} className={`${TEXT_LINK} wrap-anywhere`}>
          {sponsor.email}
        </a>
      ) : null}
    </div>
  );
}

function WebsiteLink({ href, isCompact }: Readonly<{ href: string; isCompact: boolean }>) {
  if (!isCompact) {
    return (
      <ActionLink href={href} arrow="ne" isExternal>
        {SPONSORS_COPY.website}
      </ActionLink>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${TEXT_LINK} gap-2`}>
      {SPONSORS_COPY.website}
      <ArrowGlyph direction="ne" />
    </a>
  );
}
