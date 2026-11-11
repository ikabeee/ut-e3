import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { KOF_HOME_PATH, SYSADMIN_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  ADMIN_CATALOG_PATH,
  ADMIN_MODERATION_PATH,
  ADMIN_SERVER_PATH,
  ADMIN_SETTINGS_PATH,
} from "@features/admin/lib/admin-links";

const COPY = ADMIN_COPY.nav;

const LINKS = [
  { href: SYSADMIN_HOME_PATH, label: COPY.home },
  { href: ADMIN_SETTINGS_PATH, label: COPY.settings },
  { href: ADMIN_MODERATION_PATH, label: COPY.moderation },
  { href: ADMIN_CATALOG_PATH, label: COPY.catalog },
  { href: ADMIN_SERVER_PATH, label: COPY.server },
  { href: KOF_HOME_PATH, label: COPY.kof },
];

/** The sections of the panel of the sysadmin (M7); the current one is marked for assistive technology. */
export function AdminNav({ currentPath }: Readonly<{ currentPath: string }>) {
  return (
    <nav aria-label={COPY.label} className="flex flex-wrap gap-3">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.href === currentPath ? "page" : undefined}
          className={buttonVariants({
            variant: link.href === currentPath ? "primary" : "outline",
            className: "min-h-11",
          })}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
