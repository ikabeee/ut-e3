import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getSysadmin } from "@features/accounts/lib/server/current-account";
import { AdminSidebar } from "@features/admin/components/admin-sidebar";

/**
 * The frame of every page under /admin (S10). Next keeps a layout mounted between its pages, so the sidebar is drawn
 * once and only the page beside it changes, with its own loading state. The session is read behind its own boundary,
 * so the page never waits for it; the grid only opens the sidebar column once the sidebar is there.
 */
export function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="page-wrap grid gap-6 py-12 lg:items-start lg:gap-10 lg:has-[>aside]:grid-cols-[16rem_minmax(0,1fr)]">
      <Suspense fallback={null}>
        <SysadminSidebar />
      </Suspense>
      {children}
    </div>
  );
}

/**
 * Only the sysadmin (also as the second role of a stand administrator) moves between the sections. The KOF and raffle
 * accounts that open /admin/kof or /admin/raffle get their page alone; each page still guards its own access.
 */
export async function SysadminSidebar() {
  await connection();

  return (await getSysadmin()) ? <AdminSidebar /> : null;
}
