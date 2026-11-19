import type { ReactNode } from "react";
import { AreaLink } from "@features/accounts/components/area-link";
import type { AreaLink as AreaLinkData } from "@features/accounts/lib/area-links";
import { AdminHeader } from "@features/admin/components/admin-header";
import { AdminNav } from "@features/admin/components/admin-nav";

interface AdminSectionViewProps {
  title: string;
  signedInAs: string;
  path: string;
  /** The way back to the stand for an account with a second role (S1); null for an account with one role. */
  areaLink: AreaLinkData | null;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}

/** What a section looks like once the session is known (S10): the sidebar of the panel beside the header and the content. */
export function AdminSectionView({ areaLink, children, path, ...header }: Readonly<AdminSectionViewProps>) {
  return (
    <AdminSidebarLayout currentPath={path}>
      <AdminHeader {...header} currentPath={path} />
      <AreaLink link={areaLink} />
      {children}
    </AdminSidebarLayout>
  );
}

interface AdminSidebarLayoutProps {
  /** The section on screen, marked in the sidebar; `null` for an account that only has this one screen. */
  currentPath: string | null;
  children: ReactNode;
}

/**
 * The frame of every page of the panel (S10): from 1024 px a fixed-width sidebar with the sections beside the content;
 * below that the sections are the menu of `AdminHeader`, so the sidebar is not drawn. An account without sections (the
 * KOF desks) gets the content alone.
 */
export function AdminSidebarLayout({ currentPath, children }: Readonly<AdminSidebarLayoutProps>) {
  if (currentPath === null) return <div className="grid gap-12">{children}</div>;

  return (
    <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside className="sticky top-[calc(var(--spacing-nav)+1.5rem)] hidden max-h-[calc(100dvh-var(--spacing-nav)-3rem)] overflow-y-auto border border-border bg-background p-2 lg:block">
        <AdminNav currentPath={currentPath} />
      </aside>
      <div className="grid min-w-0 content-start gap-12">{children}</div>
    </div>
  );
}
