import { LogDetails, LogRow, LogTableFrame } from "@features/admin/components/log-table-parts";
import { DateFilters, TextFilter } from "@features/admin/components/logs-filter-fields";
import { LogsFilterForm } from "@features/admin/components/logs-filter-form";
import { LogsPagination } from "@features/admin/components/logs-pagination";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { AuditLogFilters } from "@features/admin/lib/logs-filters";
import type { AuditLogRow, LogPage } from "@features/admin/lib/types";

const COPY = ADMIN_COPY.logs;

const COLUMNS = [
  COPY.columns.when,
  COPY.columns.actor,
  COPY.columns.action,
  COPY.columns.entity,
  COPY.columns.details,
] as const;

interface AuditLogsPanelProps {
  filters: AuditLogFilters;
  logs: LogPage<AuditLogRow>;
}

/** The audit log (RNF-11): who changed what, filtered by actor, action, entity and dates. */
export function AuditLogsPanel({ filters, logs }: Readonly<AuditLogsPanelProps>) {
  return (
    <section aria-labelledby="audit-logs-heading" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="audit-logs-heading" className="type-section">
          {COPY.tabs.audit}
        </h2>
        <p className="text-sm text-muted">{COPY.auditLead}</p>
      </div>
      <LogsFilterForm tab="audit">
        <TextFilter name="actor" label={COPY.actor} value={filters.actor} />
        <TextFilter name="action" label={COPY.action} value={filters.action} />
        <TextFilter name="entity" label={COPY.entity} value={filters.entity} />
        <DateFilters fromDate={filters.fromDate} toDate={filters.toDate} />
      </LogsFilterForm>
      <LogsPagination tab="audit" query={toQuery(filters)} logs={logs} />
      <AuditLogTable rows={logs.rows} />
    </section>
  );
}

function AuditLogTable({ rows }: Readonly<{ rows: readonly AuditLogRow[] }>) {
  if (rows.length === 0) return <p className="text-sm text-muted">{COPY.empty}</p>;

  return (
    <LogTableFrame label={COPY.tabs.audit} columns={COLUMNS}>
      {rows.map((row) => (
        <LogRow key={row.id} instant={row.createdAt}>
          <td className="px-3 py-2 wrap-break-word">
            {row.actor ? `${row.actor.name} (${row.actor.email})` : COPY.automatic}
          </td>
          <td className="px-3 py-2 font-mono wrap-break-word">{row.action}</td>
          <td className="px-3 py-2 wrap-break-word">
            {row.entityType} <span className="text-muted">{row.entityId}</span>
          </td>
          <td className="px-3 py-2">
            <LogDetails text={row.detail} />
          </td>
        </LogRow>
      ))}
    </LogTableFrame>
  );
}

function toQuery(filters: AuditLogFilters) {
  return {
    actor: filters.actor,
    action: filters.action,
    entity: filters.entity,
    from: filters.fromDate,
    to: filters.toDate,
  };
}
