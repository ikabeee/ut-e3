import "server-only";
import { findSustainedOverload, type OverloadSample } from "@features/admin/lib/overload-rule";
import type { ServerStatus } from "@features/admin/lib/types";
import { getPublicBracketAudience } from "@features/tournament/lib/server/public-bracket-audience";
import { getPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-queries";
import { getOutboxSummary, listUndeliveredEmails } from "@shared/lib/server/email-outbox-status";
import { getLoadSamples, readMemory, takeLoadSample } from "@shared/lib/server/system-load";

/** How many unsent emails the panel lists. */
export const UNDELIVERED_LIMIT = 20;

/** Everything the server status shows as text (RF-73, RNF-17). */
export async function getServerStatus(now: number = Date.now()): Promise<ServerStatus> {
  const samples = getLoadSamples();
  const latest = samples.at(-1) ?? takeLoadSample(now);
  const memory = readMemory();

  const [publicBracketEnabled, outbox, undelivered] = await Promise.all([
    getPublicBracketEnabled(),
    getOutboxSummary(),
    listUndeliveredEmails(UNDELIVERED_LIMIT),
  ]);

  return {
    takenAt: new Date(now).toISOString(),
    cpuShare: latest.cpu,
    memory: { ...memory, share: memory.totalBytes > 0 ? memory.usedBytes / memory.totalBytes : 0 },
    processRssBytes: process.memoryUsage().rss,
    uptimeMinutes: Math.floor(process.uptime() / 60),
    overload: describeOverload(samples, now),
    bracket: { ...getPublicBracketAudience(now), publicBracketEnabled },
    outbox,
    undelivered,
  };
}

// The metric above the threshold right now and since when, so the sysadmin sees an automatic close coming.
function describeOverload(samples: readonly OverloadSample[], now: number): ServerStatus["overload"] {
  const metric = findSustainedOverload(samples, now, { threshold: 0.5, durationMs: 0 });

  if (!metric) return null;

  const lastCalm = samples.findLastIndex((sample) => sample[metric] <= 0.5);
  const since = samples[lastCalm + 1]?.at ?? now;

  return { metric, seconds: Math.round((now - since) / 1000) };
}
