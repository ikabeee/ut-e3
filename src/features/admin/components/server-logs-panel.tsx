import { AutoRefresh } from "@features/admin/components/auto-refresh";
import { LogDetails, LogLevelChip, LogRow, LogTableFrame } from "@features/admin/components/log-table-parts";
import { ChoiceFilter, DateFilters, TextFilter } from "@features/admin/components/logs-filter-fields";
import { LogsFilterForm } from "@features/admin/components/logs-filter-form";
import { LogsPagination } from "@features/admin/components/logs-pagination";
import { PurgeServerLogsForm, type PurgeServerLogsAction } from "@features/admin/components/purge-server-logs-form";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { ServerLogFilters } from "@features/admin/lib/logs-filters";
import type { LogPage, ServerLogRow } from "@features/admin/lib/types";
import { SERVER_LOG_LEVELS, SERVER_LOG_SOURCES } from "@shared/lib/server-log-types";

const COPY = ADMIN_COPY.logs;

const AUTO_REFRESH_MS = 15_000;

const COLUMNS = [
  COPY.columns.when,
  COPY.columns.level,
  COPY.columns.source,
  COPY.columns.message,
  COPY.columns.details,
] as const;

const LEVEL_OPTIONS = SERVER_LOG_LEVELS.map((value) => ({ value, label: COPY.levels[value] }));

const SOURCE_OPTIONS = SERVER_LOG_SOURCES.map((value) => ({ value, label: COPY.sources[value] }));

interface ServerLogsPanelProps {
  filters: ServerLogFilters;
  logs: LogPage<ServerLogRow>;
  purgeAction: PurgeServerLogsAction;
}

/** The server logs kept in the database (S4): filtered, paged, optionally refreshing itself, and purgeable. */
export function ServerLogsPanel({ filters, logs, purgeAction }: Readonly<ServerLogsPanelProps>) {
  return (
    <section aria-labelledby="server-logs-heading" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="server-logs-heading" className="type-section">
          {COPY.tabs.server}
        </h2>
        <p className="text-sm text-muted">{COPY.serverLead}</p>
      </div>
      <LogsFilterForm tab="server">
        <ChoiceFilter name="level" label={COPY.level} value={filters.level} options={LEVEL_OPTIONS} />
        <ChoiceFilter name="source" label={COPY.source} value={filters.source} options={SOURCE_OPTIONS} />
        <TextFilter name="q" label={COPY.text} value={filters.text} />
        <DateFilters fromDate={filters.fromDate} toDate={filters.toDate} />
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="auto" value="1" defaultChecked={filters.isAutoRefresh} className="size-5" />
          {COPY.autoRefresh(AUTO_REFRESH_MS / 1000)}
        </label>
      </LogsFilterForm>
      {filters.isAutoRefresh ? <AutoRefresh intervalMs={AUTO_REFRESH_MS} /> : null}
      <LogsPagination tab="server" query={toQuery(filters)} logs={logs} />
      <ServerLogTable rows={logs.rows} />
      <div className="grid gap-2">
        <h3 className="type-mono">{COPY.purgeHeading}</h3>
        <p className="text-sm text-muted">{COPY.purgeLead}</p>
        <PurgeServerLogsForm action={purgeAction} />
      </div>
    </section>
  );
}

function ServerLogTable({ rows }: Readonly<{ rows: readonly ServerLogRow[] }>) {
  if (rows.length === 0) return <p className="text-sm text-muted">{COPY.empty}</p>;

  return (
    <LogTableFrame label={COPY.tabs.server} columns={COLUMNS}>
      {rows.map((row) => (
        <LogRow key={row.id} instant={row.createdAt}>
          <td className="px-3 py-2">
            <LogLevelChip level={row.level} />
          </td>
          <td className="px-3 py-2">{COPY.sources[row.source]}</td>
          <td className="max-w-xl px-3 py-2 wrap-break-word whitespace-pre-wrap">{row.message}</td>
          <td className="px-3 py-2">
            <LogDetails text={row.details} />
          </td>
        </LogRow>
      ))}
    </LogTableFrame>
  );
}

function toQuery(filters: ServerLogFilters) {
  return {
    level: filters.level ?? "",
    source: filters.source ?? "",
    q: filters.text,
    from: filters.fromDate,
    to: filters.toDate,
    auto: filters.isAutoRefresh ? "1" : "",
  };
}
