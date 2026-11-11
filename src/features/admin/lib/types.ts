import type { OverloadMetric } from "@features/admin/lib/overload-rule";

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
  bracket: { viewers: number; requestsPerMinute: number; publicBracketEnabled: boolean };
  outbox: { sent: number; pending: number; failed: number };
  undelivered: UndeliveredEmailRow[];
}
