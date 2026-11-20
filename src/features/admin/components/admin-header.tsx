import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { AreaLink } from "@features/accounts/components/area-link";
import type { AreaLink as AreaLinkData } from "@features/accounts/lib/area-links";

interface AdminHeaderProps {
  title: string;
  signedInAs: string;
  /** The way to the other area of an account with a second role (S1); null for an account with one role. */
  areaLink: AreaLinkData | null;
  signOutAction: () => Promise<void>;
}

/**
 * The top of every page of the panel: title, session, sign out and the link to the other area. The sections are not
 * here: the layout of /admin draws them once for the sysadmin (`AdminSidebar`), so they stay put between pages (S10).
 */
export function AdminHeader({ areaLink, ...header }: Readonly<AdminHeaderProps>) {
  return (
    <>
      <AccountPageHeader {...header} />
      <AreaLink link={areaLink} />
    </>
  );
}
