import { Chip } from "@heroui/react";
import type { ReactNode } from "react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";
import type { ServerLogLevel } from "@shared/lib/server-log-types";

const COPY = ADMIN_COPY.logs;

const MAX_DETAILS_CHARS = 4000;

const LEVEL_COLORS = { error: "danger", warn: "warning", info: "default" } as const;

interface LogTableFrameProps {
  label: string;
  columns: readonly string[];
  children: ReactNode;
}

/** The rows of a log in a region that scrolls both ways, so a wide message never widens the page on a phone. */
export function LogTableFrame({ label, columns, children }: Readonly<LogTableFrameProps>) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="max-h-[70svh] overflow-auto border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="border-b border-border px-3 py-2 type-mono">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** A row of a log: its date first, then the cells of the log. */
export function LogRow({ instant, children }: Readonly<{ instant: string; children: ReactNode }>) {
  return (
    <tr className="border-b border-border align-top last:border-b-0">
      <td className="px-3 py-2">
        <LogTime instant={instant} />
      </td>
      {children}
    </tr>
  );
}

function LogTime({ instant }: Readonly<{ instant: string }>) {
  return (
    <time dateTime={instant} className="whitespace-nowrap">
      {formatEventDate(instant, "numeric")} {formatTimeOfDay(instant)}
    </time>
  );
}

export function LogLevelChip({ level }: Readonly<{ level: ServerLogLevel }>) {
  return (
    <Chip color={LEVEL_COLORS[level]} variant="soft" size="sm">
      <Chip.Label>{COPY.levels[level]}</Chip.Label>
    </Chip>
  );
}

/**
 * The JSON of an entry as plain text inside a collapsed block: React escapes it, so a value that looks like HTML is
 * shown, never run, and a very long one is cut.
 */
export function LogDetails({ text }: Readonly<{ text: string | null }>) {
  if (text === null) return <span className="text-muted">{COPY.noDetails}</span>;

  return (
    <details className="max-w-md">
      <summary className="min-h-11 cursor-pointer py-2">{COPY.showDetails}</summary>
      <pre className="overflow-x-auto bg-surface p-2 font-mono text-xs wrap-break-word whitespace-pre-wrap">
        {text.slice(0, MAX_DETAILS_CHARS)}
      </pre>
      {text.length > MAX_DETAILS_CHARS ? (
        <p className="type-tiny text-muted">{COPY.detailsTruncated(MAX_DETAILS_CHARS)}</p>
      ) : null}
    </details>
  );
}
