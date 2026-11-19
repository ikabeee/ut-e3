import Link from "next/link";
import { AdminNavIcon } from "@features/admin/components/admin-nav-icons";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_NAV_ITEMS, type AdminNavItem } from "@features/admin/lib/admin-nav-items";

const LINK_CLASS =
  "flex min-h-11 items-center gap-3 px-3 type-mono no-underline transition-colors focus-visible:text-accent";

const CURRENT_CLASS = "bg-accent text-accent-foreground focus-visible:text-accent-foreground";

const OTHER_CLASS = "text-foreground hover:bg-surface hover:text-accent active:bg-surface";

/** The sections of the panel of the sysadmin (M7), one per line with its icon; the current one is marked (S10). */
export function AdminNav({ currentPath }: Readonly<{ currentPath: string }>) {
  return (
    <nav aria-label={ADMIN_COPY.nav.label}>
      <ul className="m-0 grid list-none gap-1 p-0">
        {ADMIN_NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <AdminNavLink item={item} isCurrent={item.href === currentPath} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AdminNavLink({ item, isCurrent }: Readonly<{ item: AdminNavItem; isCurrent: boolean }>) {
  return (
    <Link
      href={item.href}
      aria-current={isCurrent ? "page" : undefined}
      className={`${LINK_CLASS} ${isCurrent ? CURRENT_CLASS : OTHER_CLASS}`}
    >
      <AdminNavIcon name={item.icon} />
      <span className="min-w-0 wrap-break-word">{item.label}</span>
    </Link>
  );
}
