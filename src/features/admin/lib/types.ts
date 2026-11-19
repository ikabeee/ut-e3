import type { EmailKind } from "@shared/lib/email-kinds";
import type { OverloadMetric, OverloadSample } from "@features/admin/lib/overload-rule";

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

export type EmailStatus = "sent" | "pending" | "failed";

/** One email of the outbox for the sysadmin, with its full address; the body itself is read apart (and audited). */
export interface EmailRow {
  id: string;
  to: string;
  subject: string;
  kind: EmailKind | null;
  status: EmailStatus;
  attempts: number;
  nextAttemptAt: string;
  sentAt: string | null;
  lastError: string | null;
  createdAt: string;
  hasBody: boolean;
  /** Unsent and still with a body: it can go back to the queue. */
  canResend: boolean;
  /** Abandoned, body erased and of a kind that can be made again. */
  canRebuild: boolean;
}

export interface EmailPage {
  rows: EmailRow[];
  total: number;
  page: number;
  pageCount: number;
}

/** What the view of an email answers: its text, or the reason it cannot be shown. */
export type EmailTextState = { status: "text"; text: string } | { status: "error"; message: string };
