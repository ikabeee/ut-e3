import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { AdminNav } from "@features/admin/components/admin-nav";

interface AdminHeaderProps {
  title: string;
  signedInAs: string;
  /** The section on screen, marked in the navigation; `null` for an account that only has this one screen. */
  currentPath: string | null;
  signOutAction: () => Promise<void>;
}

/**
 * The top of every page of the panel: title, session, sign out and, for the sysadmin, the sections. The KOF accounts
 * use the same frame in /admin/kof without the sections, which they cannot open (S11).
 */
export function AdminHeader({ title, signedInAs, currentPath, signOutAction }: Readonly<AdminHeaderProps>) {
  return (
    <div className="grid gap-6">
      <AccountPageHeader title={title} signedInAs={signedInAs} signOutAction={signOutAction} />
      {currentPath === null ? null : <AdminNav currentPath={currentPath} />}
    </div>
  );
}
