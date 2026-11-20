"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@features/admin/components/admin-nav";
import { AdminNavIcon } from "@features/admin/components/admin-nav-icons";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";

/**
 * The sections of the panel (S10), drawn once by the layout of /admin, which stays mounted while the pages change: it
 * reads the current path to mark its section. From 1024 px a fixed-width sidebar; below that a menu that folds above
 * the page.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="grid content-start lg:sticky lg:top-[calc(var(--spacing-nav)+1.5rem)] lg:max-h-[calc(100dvh-var(--spacing-nav)-3rem)] lg:overflow-y-auto lg:border lg:border-border lg:bg-background lg:p-2">
      <AdminMobileMenu key={pathname} currentPath={pathname} />
      <div className="hidden lg:block">
        <AdminNav currentPath={pathname} />
      </div>
    </aside>
  );
}

// A native disclosure: it opens with a tap or the keyboard and needs no state. The sidebar keys it by the path, so a
// navigation mounts it again, closed.
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
