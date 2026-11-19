import "server-only";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import {
  findSustainedOverload,
  formatShare,
  PUBLIC_BRACKET_OVERLOAD_RULE,
  SAMPLE_INTERVAL_MS,
} from "@features/admin/lib/overload-rule";
import { setPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-mutations";
import { startJob } from "@shared/lib/server/background-jobs";
import { sendEmergencyAlert } from "@shared/lib/server/emergency-alert";
import { clearLoadSamples, getLoadSamples, takeLoadSample, type LoadSample } from "@shared/lib/server/system-load";

/** What checkOverload uses from outside: how it reads the machine and how it closes the bracket. */
export interface OverloadWatchDependencies {
  sample: (now: number) => LoadSample;
  close: (reason: string) => Promise<boolean>;
}

export const OVERLOAD_WATCH_JOB = "overload-watch";

const EMERGENCY = ADMIN_COPY.emergency;

/**
 * Started once by instrumentation.ts as a job of the registry (so /admin/recovery can report and restart it); the timer
 * does not keep the process alive. A sustained overload and a failure of the watch itself are production emergencies
 * (S20).
 */
export function startOverloadWatch(): void {
  startJob({
    name: OVERLOAD_WATCH_JOB,
    intervalMs: SAMPLE_INTERVAL_MS,
    run: () => checkOverload().then(alertOverload),
    onError: alertWatchFailure,
  });
}

/**
 * Takes a sample and, when the CPU or the memory stayed above the threshold of
 * `PUBLIC_BRACKET_OVERLOAD_RULE` (85%) for 2 minutes, closes the public bracket on its own
 * (RF-74, UT-AD-09). The operation of the tournament keeps working. After a close the history starts over, so a
 * sysadmin who reopens the bracket gets 2 more minutes before the next automatic close.
 */
export async function checkOverload(
  now: number = Date.now(),
  { sample, close }: OverloadWatchDependencies = { sample: takeLoadSample, close: closeBySystem },
) {
  sample(now);

  const metric = findSustainedOverload(getLoadSamples(), now, PUBLIC_BRACKET_OVERLOAD_RULE);

  if (!metric) return null;

  clearLoadSamples();

  const closed = await close(`overload:${metric}`);

  if (closed)
    console.warn(
      `Public bracket closed automatically: ${metric} above ${formatShare(PUBLIC_BRACKET_OVERLOAD_RULE.threshold)} for 2 minutes.`,
    );

  return metric;
}

async function alertOverload(metric: string | null): Promise<void> {
  if (!metric) return;

  const threshold = formatShare(PUBLIC_BRACKET_OVERLOAD_RULE.threshold);

  await sendEmergencyAlert({
    key: `overload:${metric}`,
    subject: EMERGENCY.overloadSubject(metric),
    detail: EMERGENCY.overloadDetail(metric, threshold),
  });
}

async function alertWatchFailure(cause: unknown): Promise<void> {
  const message = cause instanceof Error ? cause.message : "Unknown error";

  console.error(`Overload watch failed: ${message}`);
  await sendEmergencyAlert({ key: "overload-watch", subject: EMERGENCY.watchFailedSubject, detail: message });
}

function closeBySystem(reason: string): Promise<boolean> {
  return setPublicBracketEnabled(null, false, reason);
}
