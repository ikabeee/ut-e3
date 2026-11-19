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

/** The state of one background job: whether its interval is active and how its last run ended. */
export interface JobState {
  isRunning: boolean;
  lastRunAt: string | null;
  lastError: string | null;
}

/** What /admin/recovery shows: the state of each background service and of the database files. */
export interface RecoveryStatus {
  mail: {
    /** Only the host of SMTP_HOST: never the user, the password or the sender. */
    smtpHost: string | null;
    worker: JobState | null;
    outbox: ServerStatus["outbox"];
    lastSentAt: string | null;
    lastFailure: string | null;
  };
  overloadWatch: JobState | null;
  database: { databaseBytes: number; walBytes: number; shmBytes: number; freeBytes: number | null };
  publicBracketEnabled: boolean;
}
