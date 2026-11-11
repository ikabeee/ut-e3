import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { OutboxList, type OutboxAction } from "@features/admin/components/outbox-list";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { formatShare } from "@features/admin/lib/overload-rule";
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

/** The state of the server as plain text (RF-73): no charts, so it reads well on a phone and in a screen reader. */
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
        <p className="type-tiny text-muted">{COPY.takenAt(formatTimeOfDay(status.takenAt))}</p>
        <LoadLines status={status} />
      </section>
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
