import Link from "next/link";
import { Button, buttonVariants } from "@heroui/react";
import type { ReactNode } from "react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_LOGS_PATH, buildLogsHref } from "@features/admin/lib/admin-links";
import type { LogsTab } from "@features/admin/lib/logs-filters";

const COPY = ADMIN_COPY.logs;

interface LogsFilterFormProps {
  tab: LogsTab;
  children: ReactNode;
}

/** The filters as a plain GET form: the address keeps them, so a filtered list can be reloaded, shared and paged. */
export function LogsFilterForm({ tab, children }: Readonly<LogsFilterFormProps>) {
  return (
    <form method="get" action={ADMIN_LOGS_PATH} aria-label={COPY.filtersLabel} className="grid max-w-5xl gap-3">
      <input type="hidden" name="tab" value={tab} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" className="min-h-11">
          {COPY.apply}
        </Button>
        <Link href={buildLogsHref(tab, {})} className={buttonVariants({ variant: "outline", className: "min-h-11" })}>
          {COPY.clear}
        </Link>
      </div>
    </form>
  );
}
