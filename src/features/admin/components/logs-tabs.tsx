import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildLogsHref } from "@features/admin/lib/admin-links";
import type { LogsTab } from "@features/admin/lib/logs-filters";

const COPY = ADMIN_COPY.logs;

const TABS: readonly LogsTab[] = ["audit", "server"];

/** The two logs of the page as links, so each tab is an address that can be opened, shared and reloaded. */
export function LogsTabs({ currentTab }: Readonly<{ currentTab: LogsTab }>) {
  return (
    <nav aria-label={COPY.tabsLabel} className="flex flex-wrap gap-3">
      {TABS.map((tab) => (
        <Link
          key={tab}
          href={buildLogsHref(tab, {})}
          aria-current={tab === currentTab ? "page" : undefined}
          className={buttonVariants({ variant: tab === currentTab ? "primary" : "outline", className: "min-h-11" })}
        >
          {COPY.tabs[tab]}
        </Link>
      ))}
    </nav>
  );
}
