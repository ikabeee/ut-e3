import type { OverloadMetric, OverloadSample } from "@features/admin/lib/overload-rule";
import type { ServerLogLevel, ServerLogSource } from "@shared/lib/server-log-types";

export interface UndeliveredEmailRow {
  id: string;
  to: string;
  subject: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  failed: boolean;
  canResend: boolean;
}

export interface ServerStatus {
  takenAt: string;
  cpuShare: number;
  memory: { usedBytes: number; totalBytes: number; share: number; source: "cgroup" | "host" };
  processRssBytes: number;
  uptimeMinutes: number;
  overload: { metric: OverloadMetric; seconds: number } | null;
  /** The readings of the last minutes, oldest first, for the charts of the panel (S4). */
  history: OverloadSample[];
  bracket: { viewers: number; requestsPerMinute: number; publicBracketEnabled: boolean };
  outbox: { sent: number; pending: number; failed: number };
  undelivered: UndeliveredEmailRow[];
}

/** One cell of a result: null and blobs are marked so they are never mistaken for the text "NULL". */
export interface SqlCell {
  kind: "value" | "null" | "blob";
  text: string;
}

export interface SqlReadResult {
  columns: string[];
  rows: SqlCell[][];
  isTruncated: boolean;
}

/** What the console answers: an error for the toast, a read, the review of a write, or the write done. */
export type SqlConsoleState =
  | { status: "error"; message: string }
  | { status: "read"; message: string; result: SqlReadResult }
  | { status: "review"; message: string; statement: string; affectedRows: number }
  | { status: "done"; message: string; affectedRows: number };

/** One page of a log list; `page` is already inside 1 to `pageCount`. */
export interface LogPage<Row> {
  rows: Row[];
  total: number;
  page: number;
  pageCount: number;
}

export interface AuditLogRow {
  id: string;
  createdAt: string;
  /** Name and email of the account; null when no staff account made the change (the automatic close, a recovery). */
  actor: { name: string; email: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  /** The JSON of the entry as indented text; null when it is empty. */
  detail: string | null;
}

export interface ServerLogRow {
  id: string;
  createdAt: string;
  level: ServerLogLevel;
  source: ServerLogSource;
  message: string;
  /** The JSON of the event as indented text; null when it is empty. */
  details: string | null;
}
