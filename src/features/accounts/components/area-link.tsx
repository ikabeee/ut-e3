import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { AreaLink as AreaLinkData } from "@features/accounts/lib/area-links";
import { ActionLink } from "@shared/components/action-link";

interface AreaLinkProps {
  /** Null for an account with one role: there is no other area to go to. */
  link: AreaLinkData | null;
}

/** The way from one area of an account with two roles to the other one (S1). */
export function AreaLink({ link }: Readonly<AreaLinkProps>) {
  if (!link) return null;

  return (
    <nav aria-label={ACCOUNTS_COPY.areas.navLabel}>
      <ActionLink href={link.href} variant="outline" className="min-h-11">
        {link.label}
      </ActionLink>
    </nav>
  );
}
