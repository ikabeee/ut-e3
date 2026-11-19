import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { AdminNav } from "@features/admin/components/admin-nav";
import { AdminNavIcon } from "@features/admin/components/admin-nav-icons";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";

interface AdminHeaderProps {
  title: string;
  signedInAs: string;
  /** The section on screen, marked in the menu; `null` for an account that only has this one screen. */
  currentPath: string | null;
  signOutAction: () => Promise<void>;
}

/**
 * The top of every page of the panel: title, session, sign out and, below 1024 px, the menu with the sections (from
 * there the sidebar of `AdminSidebarLayout` shows them). The KOF accounts use the same frame in /admin/kof without
 * the sections, which they cannot open (S11).
 */
export function AdminHeader({ title, signedInAs, currentPath, signOutAction }: Readonly<AdminHeaderProps>) {
  return (
    <div className="grid gap-6">
      <AccountPageHeader title={title} signedInAs={signedInAs} signOutAction={signOutAction} />
      {currentPath === null ? null : <AdminMobileMenu currentPath={currentPath} />}
    </div>
  );
}

// A native disclosure: it opens with a tap or the keyboard, needs no script and starts closed on every page.
function AdminMobileMenu({ currentPath }: Readonly<{ currentPath: string }>) {
  return (
    <details className="border border-border lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 type-mono [&::-webkit-details-marker]:hidden">
        <AdminNavIcon name="menu" />
        {ADMIN_COPY.nav.menu}
      </summary>
      <div className="border-t border-border p-2">
        <AdminNav currentPath={currentPath} />
      </div>
    </details>
  );
}
