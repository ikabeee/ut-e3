import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { AreaLink } from "@features/accounts/components/area-link";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { getOtherAreaLink } from "@features/accounts/lib/area-links";

interface StaffPageHeaderProps {
  title: string;
  signedInAs: string;
  /** The roles of the session: with a second role the header links to the other area (S1). */
  roles: readonly string[];
  /** Which of the two roles this page belongs to. */
  area: "primary" | "secondary";
}

/** The header of a staff page with sign-out, plus the link to the other area of an account with two roles. */
export function StaffPageHeader({ title, signedInAs, roles, area }: Readonly<StaffPageHeaderProps>) {
  return (
    <>
      <AccountPageHeader title={title} signedInAs={signedInAs} signOutAction={signOut} />
      <AreaLink link={getOtherAreaLink(roles, area)} />
    </>
  );
}
