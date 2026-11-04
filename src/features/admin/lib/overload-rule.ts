export interface OverloadSample {
  at: number;
  cpu: number;
  memory: number;
}

export type OverloadMetric = "cpu" | "memory";

export interface OverloadRule {
  /** A share from 0 to 1; the rule needs every sample strictly above it. */
  threshold: number;
  durationMs: number;
}

/** RF-74: the public bracket closes on its own when the CPU or the memory stay above 50% for 2 minutes. */
export const PUBLIC_BRACKET_OVERLOAD_RULE: OverloadRule = { threshold: 0.5, durationMs: 2 * 60_000 };

/**
 * The metric that stayed above the threshold for the whole duration up to `now`, or null (UT-AD-07, UT-AD-08). The
 * streak starts at the first sample after the last one that was not above, and the history must reach back that far:
 * with no sample at or before `now - durationMs` there is not enough history to decide.
 */
export function findSustainedOverload(
  samples: readonly OverloadSample[],
  now: number,
  rule: OverloadRule = PUBLIC_BRACKET_OVERLOAD_RULE,
): OverloadMetric | null {
  const metrics: OverloadMetric[] = ["cpu", "memory"];

  return metrics.find((metric) => isSustained(samples, now, { metric, rule })) ?? null;
}

function isSustained(
  samples: readonly OverloadSample[],
  now: number,
  { metric, rule }: { metric: OverloadMetric; rule: OverloadRule },
): boolean {
  const sorted = samples.filter((sample) => sample.at <= now).toSorted((first, second) => first.at - second.at);
  const lastCalm = sorted.findLastIndex((sample) => sample[metric] <= rule.threshold);
  const streak = sorted.slice(lastCalm + 1);

  return streak.length > 0 && now - streak[0].at >= rule.durationMs;
}

/** A share as a percentage for the panel: 0.537 reads "53.7%". */
export function formatShare(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}
