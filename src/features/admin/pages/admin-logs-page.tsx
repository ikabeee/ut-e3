import { AuditLogsPanel } from "@features/admin/components/audit-logs-panel";
import { LogsTabs } from "@features/admin/components/logs-tabs";
import { ServerLogsPanel } from "@features/admin/components/server-logs-panel";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_LOGS_PATH } from "@features/admin/lib/admin-links";
import { purgeServerLogsAction } from "@features/admin/lib/logs-actions";
import {
  parseAuditLogFilters,
  parseLogsTab,
  parseServerLogFilters,
  type LogsSearchParams,
} from "@features/admin/lib/logs-filters";
import { getAuditLogPage, getServerLogPage } from "@features/admin/lib/server/logs-queries";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";

const PAGE = ADMIN_COPY.pages.logs;

export const adminLogsPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_LOGS_PATH);

export function AdminLogsPage({ searchParams }: Readonly<PageProps<"/admin/logs">>) {
  return <AdminSectionShell title={PAGE.title} path={ADMIN_LOGS_PATH} renderContent={() => renderLogs(searchParams)} />;
}

// `?tab=` picks the log and the rest of the address holds its filters; both are read on every visit.
async function renderLogs(searchParams: PageProps<"/admin/logs">["searchParams"]) {
  const params = await searchParams;
  const tab = parseLogsTab(params);

  return (
    <>
      <LogsTabs currentTab={tab} />
      {tab === "server" ? await renderServerLogs(params) : await renderAuditLogs(params)}
    </>
  );
}

async function renderAuditLogs(params: LogsSearchParams) {
  const filters = parseAuditLogFilters(params);

  return <AuditLogsPanel filters={filters} logs={await getAuditLogPage(filters)} />;
}

async function renderServerLogs(params: LogsSearchParams) {
  const filters = parseServerLogFilters(params);

  return (
    <ServerLogsPanel filters={filters} logs={await getServerLogPage(filters)} purgeAction={purgeServerLogsAction} />
  );
}
