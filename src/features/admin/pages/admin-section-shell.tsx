import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { getOtherAreaLink } from "@features/accounts/lib/area-links";
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { AdminSectionView } from "@features/admin/components/admin-sidebar";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { PanelSkeleton } from "@shared/components/panel-skeleton";

interface AdminSectionShellProps {
  title: string;
  path: string;
  /** The content of the section, read once the session is known to be the sysadmin. */
  renderContent: () => Promise<ReactNode>;
}

/** The metadata every section of the panel shares: its own title and canonical, never indexed. */
export function buildAdminSectionMetadata(page: { title: string; description: string }, path: string): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: path },
    robots: { index: false, follow: false },
  };
}

/** The frame of a section of the panel (M7): the static shell, and the session and data streamed behind Suspense. */
export function AdminSectionShell(props: Readonly<AdminSectionShellProps>) {
  return (
    <main className="page-wrap grid gap-12 py-12">
      <Suspense fallback={<PanelSkeleton label={ADMIN_COPY.loading} />}>
        <AdminSectionContent {...props} />
      </Suspense>
    </main>
  );
}

// Reads the session cookie and the database, so it streams behind the Suspense boundary instead of blocking the shell.
async function AdminSectionContent({ title, path, renderContent }: Readonly<AdminSectionShellProps>) {
  await connection();

  const account = await requireSysadmin();

  return (
    <AdminSectionView
      title={title}
      signedInAs={ADMIN_COPY.signedInAs(account.name)}
      path={path}
      areaLink={getOtherAreaLink(account.roles, "secondary")}
      signOutAction={signOut}
    >
      {await renderContent()}
    </AdminSectionView>
  );
}
