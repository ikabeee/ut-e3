import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildLogsHref } from "@features/admin/lib/admin-links";
import type { LogsTab } from "@features/admin/lib/logs-filters";
import type { LogPage } from "@features/admin/lib/types";

const COPY = ADMIN_COPY.logs;

interface LogsPaginationProps {
  tab: LogsTab;
  /** The filters of the tab, kept in the links to the other pages. */
  query: Record<string, string>;
  logs: Pick<LogPage<unknown>, "total" | "page" | "pageCount">;
}

/** The count and the links to the previous and the next page, which keep the filters in the address. */
export function LogsPagination({ tab, query, logs }: Readonly<LogsPaginationProps>) {
  const { total, page, pageCount } = logs;

  return (
    <nav aria-label={COPY.paginationLabel} className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-muted" role="status">
        {COPY.count(total)} {COPY.pageOf(page, pageCount)}
      </p>
      {page > 1 ? (
        <Link
          href={buildLogsHref(tab, query, page - 1)}
          className={buttonVariants({ variant: "outline", className: "min-h-11" })}
        >
          {COPY.previous}
        </Link>
      ) : null}
      {page < pageCount ? (
        <Link
          href={buildLogsHref(tab, query, page + 1)}
          className={buttonVariants({ variant: "outline", className: "min-h-11" })}
        >
          {COPY.next}
        </Link>
      ) : null}
    </nav>
  );
}
