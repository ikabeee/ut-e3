import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { AdminNav } from "@features/admin/components/admin-nav";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";

interface AdminHeaderProps {
  title: string;
  accountName: string;
  currentPath: string;
  signOutAction: () => Promise<void>;
}

/** The top of every page of the panel: title, session, sign out and the sections. */
export function AdminHeader({ title, accountName, currentPath, signOutAction }: Readonly<AdminHeaderProps>) {
  return (
    <div className="grid gap-6">
      <AccountPageHeader title={title} signedInAs={ADMIN_COPY.signedInAs(accountName)} signOutAction={signOutAction} />
      <AdminNav currentPath={currentPath} />
    </div>
  );
}
