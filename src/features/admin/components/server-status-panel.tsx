import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { AutoRefresh } from "@features/admin/components/auto-refresh";
import { LoadChartFigure } from "@features/admin/components/load-chart-figure";
import { OutboxList, type OutboxAction } from "@features/admin/components/outbox-list";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { formatShare, SAMPLE_INTERVAL_MS, type OverloadSample } from "@features/admin/lib/overload-rule";
import type { ServerStatus } from "@features/admin/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface ServerStatusPanelProps {
  status: ServerStatus;
  /** Where "Actualizar" goes: the same page, read again. */
  refreshHref: string;
  resendAction: OutboxAction;
}

const COPY = ADMIN_COPY.server;

const MEBIBYTE = 1024 * 1024;

const SAMPLE_SECONDS = SAMPLE_INTERVAL_MS / 1000;

/**
 * The state of the server (RF-73): the numbers as text, which reads well on a phone and in a screen reader, and the
 * history of the CPU and the memory as charts (S4). The page reads itself again as often as a new sample arrives.
 */
export function ServerStatusPanel({ status, refreshHref, resendAction }: Readonly<ServerStatusPanelProps>) {
  return (
    <div className="grid gap-10">
      <section aria-labelledby="server-load-heading" className="grid gap-3" data-testid="server-load">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="server-load-heading" className="type-section">
            {COPY.heading}
          </h2>
          <Link href={refreshHref} className={buttonVariants({ variant: "outline", className: "min-h-11" })}>
            {COPY.refresh}
          </Link>
        </div>
        <p className="type-tiny text-muted">
          {COPY.takenAt(formatTimeOfDay(status.takenAt))} {COPY.autoRefresh(SAMPLE_SECONDS)}
        </p>
        <AutoRefresh intervalMs={SAMPLE_INTERVAL_MS} />
        <LoadLines status={status} />
      </section>
      <LoadCharts history={status.history} />
      <section aria-labelledby="server-bracket-heading" className="grid gap-2" data-testid="server-bracket">
        <h2 id="server-bracket-heading" className="type-section">
          {COPY.bracketHeading}
        </h2>
        <p>{COPY.bracketViewers(status.bracket.viewers)}</p>
        <p>{COPY.bracketRequests(status.bracket.requestsPerMinute)}</p>
      </section>
      <OutboxList outbox={status.outbox} emails={status.undelivered} resendAction={resendAction} />
    </div>
  );
}

function LoadLines({ status }: Readonly<{ status: ServerStatus }>) {
  const { memory, overload } = status;

  return (
    <ul className="m-0 grid list-none gap-1 p-0">
      <li>
        {COPY.memory(formatMebibytes(memory.usedBytes), formatMebibytes(memory.totalBytes), formatShare(memory.share))}{" "}
        <span className="text-muted">{COPY.memorySource[memory.source]}</span>
      </li>
      <li>{COPY.cpu(formatShare(status.cpuShare))}</li>
      <li>{COPY.processMemory(formatMebibytes(status.processRssBytes))}</li>
      <li>{COPY.uptime(status.uptimeMinutes)}</li>
      <li className="text-muted">{COPY.overloadRule}</li>
      {overload ? (
        <li role="alert" className="text-danger">
          {COPY.overloadSince(COPY.metricNames[overload.metric], overload.seconds)}
        </li>
      ) : null}
    </ul>
  );
}

function formatMebibytes(bytes: number): string {
  return `${Math.round(bytes / MEBIBYTE).toLocaleString("es-MX")} MiB`;
}

function LoadCharts({ history }: Readonly<{ history: readonly OverloadSample[] }>) {
  return (
    <section aria-labelledby="server-charts-heading" className="grid gap-4" data-testid="server-charts">
      <div className="grid gap-1">
        <h2 id="server-charts-heading" className="type-section">
          {COPY.charts.heading}
        </h2>
        <p className="text-sm text-muted">{COPY.charts.lead(SAMPLE_SECONDS)}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <LoadChartFigure metric="cpu" history={history} />
        <LoadChartFigure metric="memory" history={history} />
      </div>
    </section>
  );
}
