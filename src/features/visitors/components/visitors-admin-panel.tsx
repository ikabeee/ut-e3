import Link from "next/link";
import { Button, Input, Label, TextField } from "@heroui/react";
import { VisitorRowActions, type VisitorAdminActions } from "@features/visitors/components/visitor-row-actions";
import type {
  AdminVisitorPage,
  AdminVisitorRow,
  DailyRegistrations,
  VisitorListParams,
} from "@features/visitors/lib/types";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";
import { buildExportQuery, buildListHref } from "@features/visitors/lib/visitors-admin";
import { VISITORS_EXPORT_PATH } from "@features/visitors/lib/visitors-links";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";

interface VisitorsAdminPanelProps {
  /** The path of the page that shows the list; the pagination links go back to it. */
  basePath: string;
  params: VisitorListParams;
  page: AdminVisitorPage;
  perDay: readonly DailyRegistrations[];
  actions: VisitorAdminActions;
}

const COPY = VISITORS_ADMIN_COPY;

/** The registrations for the sysadmin: search, count per day, one card per passport with its actions, and the CSV. */
export function VisitorsAdminPanel({ basePath, params, page, perDay, actions }: Readonly<VisitorsAdminPanelProps>) {
  return (
    <section aria-labelledby="visitors-admin-heading" className="grid gap-8">
      <div className="grid gap-2">
        <h2 id="visitors-admin-heading" className="type-section">
          {COPY.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.lead}</p>
      </div>
      <DailyCounts perDay={perDay} />
      <SearchForm basePath={basePath} params={params} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">{COPY.list.summary(page.total, page.page, page.pageCount)}</p>
        <a href={buildExportHref(params)} className="min-h-11 content-center link-wipe" download>
          {COPY.list.exportCsv}
        </a>
      </div>
      {page.rows.length === 0 ? <p className="text-sm text-muted">{COPY.list.empty}</p> : null}
      <ul className="m-0 grid list-none gap-4 p-0" data-testid="visitors-list">
        {page.rows.map((row) => (
          <li key={row.id}>
            <VisitorCard visitor={row} actions={actions} />
          </li>
        ))}
      </ul>
      <Pagination basePath={basePath} params={params} page={page} />
    </section>
  );
}

function buildExportHref(params: VisitorListParams): string {
  const query = buildExportQuery(params);

  return query ? `${VISITORS_EXPORT_PATH}?${query}` : VISITORS_EXPORT_PATH;
}

function DailyCounts({ perDay }: Readonly<{ perDay: readonly DailyRegistrations[] }>) {
  return (
    <div className="grid gap-2">
      <h3 className="type-tiny">{COPY.perDay.heading}</h3>
      {perDay.length === 0 ? <p className="text-sm text-muted">{COPY.perDay.empty}</p> : null}
      <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0 text-sm" data-testid="registrations-per-day">
        {perDay.map((entry) => (
          <li key={entry.day}>{COPY.perDay.row(entry.day, entry.count)}</li>
        ))}
      </ul>
    </div>
  );
}

function SearchForm({ basePath, params }: Readonly<{ basePath: string; params: VisitorListParams }>) {
  return (
    <form method="get" action={basePath} className="flex flex-wrap items-end gap-3">
      <TextField name="q" defaultValue={params.query} className="max-w-sm grow">
        <Label>{COPY.search.label}</Label>
        <Input className="min-h-11 text-base" autoComplete="off" />
      </TextField>
      <label className="grid gap-1 text-sm">
        {COPY.search.sortLabel}
        <select
          name="sort"
          defaultValue={params.sort}
          className="min-h-11 border border-border bg-surface px-3 text-base"
        >
          <option value="newest">{COPY.search.newest}</option>
          <option value="oldest">{COPY.search.oldest}</option>
        </select>
      </label>
      <Button type="submit" variant="primary" className="min-h-11">
        {COPY.search.submit}
      </Button>
      <Link href={basePath} className="min-h-11 content-center link-wipe">
        {COPY.search.clear}
      </Link>
    </form>
  );
}

function VisitorCard({ visitor, actions }: Readonly<{ visitor: AdminVisitorRow; actions: VisitorAdminActions }>) {
  return (
    <article aria-label={visitor.gamertag} className="grid gap-4 border border-border p-4">
      <h3 className="type-mono text-lg break-all">{visitor.gamertag}</h3>
      <dl className="m-0 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Field label={COPY.list.columns.name} value={visitor.fullName} />
        <Field label={COPY.list.columns.email} value={visitor.email} />
        <Field label={COPY.list.columns.createdAt} value={formatCreatedAt(visitor.createdAt)} />
        <Field label={COPY.list.columns.visits} value={String(visitor.visitCount)} />
        <Field label={COPY.list.columns.tickets} value={String(visitor.activeTickets)} />
        <Field label={COPY.list.columns.kof} value={describeKof(visitor.tournamentStatus)} />
        <Field label={COPY.list.columns.status} value={visitor.isExcluded ? COPY.list.excluded : COPY.list.active} />
      </dl>
      <VisitorRowActions visitor={visitor} actions={actions} />
    </article>
  );
}

function Field({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid gap-0.5">
      <dt className="type-tiny text-muted">{label}</dt>
      <dd className="m-0 break-all">{value}</dd>
    </div>
  );
}

function formatCreatedAt(instant: string): string {
  return `${formatEventDate(instant, "numeric")} ${formatTimeOfDay(instant)}`;
}

function describeKof(status: string | null): string {
  if (status === null) return COPY.list.noKof;

  const labels: Record<string, string> = COPY.list.kofStatus;

  return labels[status] ?? status;
}

function Pagination({
  basePath,
  params,
  page,
}: Readonly<{ basePath: string; params: VisitorListParams; page: AdminVisitorPage }>) {
  if (page.pageCount <= 1) return null;

  return (
    <nav aria-label={COPY.list.pagination} className="flex flex-wrap gap-3">
      {page.page > 1 ? (
        <Link href={buildListHref(basePath, params, page.page - 1)} className="min-h-11 content-center link-wipe">
          {COPY.list.previous}
        </Link>
      ) : null}
      {page.page < page.pageCount ? (
        <Link href={buildListHref(basePath, params, page.page + 1)} className="min-h-11 content-center link-wipe">
          {COPY.list.next}
        </Link>
      ) : null}
    </nav>
  );
}
