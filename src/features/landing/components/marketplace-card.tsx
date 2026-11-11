import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import type { MarketplaceRegistration } from "@features/landing/lib/marketplace-registration";
import { ActionLink } from "@shared/components/action-link";

interface MarketplaceCardProps {
  registration: MarketplaceRegistration;
}

export function MarketplaceCard({ registration }: Readonly<MarketplaceCardProps>) {
  if (registration.status === "open") {
    return (
      <ActionLink href={registration.formUrl} variant="primary" arrow="ne" isExternal className="self-start">
        {LANDING_COPY.activities.requestSpot}
      </ActionLink>
    );
  }

  if (registration.status === "closed") {
    return <p className="m-0 type-mono text-muted">{LANDING_COPY.activities.marketplaceClosed}</p>;
  }

  return null;
}
