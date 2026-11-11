import "server-only";
import { findSustainedOverload, formatShare, PUBLIC_BRACKET_OVERLOAD_RULE } from "@features/admin/lib/overload-rule";
import { setPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-mutations";
import { clearLoadSamples, getLoadSamples, takeLoadSample, type LoadSample } from "@shared/lib/server/system-load";

/** One sample every 10 seconds: 12 of them cover the 2 minutes of the rule (RF-74). */
export const SAMPLE_INTERVAL_MS = 10_000;

/** What checkOverload uses from outside: how it reads the machine and how it closes the bracket. */
export interface OverloadWatchDependencies {
  sample: (now: number) => LoadSample;
  close: (reason: string) => Promise<boolean>;
}

/** Started once by instrumentation.ts; the timer does not keep the process alive. */
export function startOverloadWatch(): void {
  const timer = setInterval(() => {
    checkOverload().catch((cause: unknown) => {
      console.error(`Overload watch failed: ${cause instanceof Error ? cause.message : "Unknown error"}`);
    });
  }, SAMPLE_INTERVAL_MS);

  timer.unref();
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

function closeBySystem(reason: string): Promise<boolean> {
  return setPublicBracketEnabled(null, false, reason);
}
