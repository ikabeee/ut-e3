import {
  PUBLIC_BRACKET_OVERLOAD_RULE,
  type OverloadMetric,
  type OverloadSample,
} from "@features/admin/lib/overload-rule";

export interface ChartSize {
  width: number;
  height: number;
}

/** The geometry of one metric in SVG units: 0% at the bottom, 100% at the top, time from left to right. */
export interface LoadChart {
  line: string;
  /** The line closed down to the bottom, to shade what is under it. */
  area: string;
  /** Where the 85% of the automatic close of the public bracket falls (RF-74). */
  thresholdY: number;
  latest: number;
  peak: number;
  startsAt: number;
  endsAt: number;
}

export const LOAD_CHART_SIZE: ChartSize = { width: 600, height: 160 };

/** The history of one metric as a line (S4), or `null` while there are not two readings apart in time to join. */
export function buildLoadChart(
  samples: readonly OverloadSample[],
  metric: OverloadMetric,
  size: ChartSize = LOAD_CHART_SIZE,
): LoadChart | null {
  const sorted = samples.toSorted((first, second) => first.at - second.at);
  const startsAt = sorted[0]?.at ?? 0;
  const endsAt = sorted.at(-1)?.at ?? 0;

  if (sorted.length < 2 || endsAt === startsAt) return null;

  const points = sorted.map((sample) => toPoint(sample, metric, { size, startsAt, endsAt }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point}`).join(" ");
  const values = sorted.map((sample) => sample[metric]);

  return {
    line,
    area: `${line} L${size.width},${size.height} L0,${size.height} Z`,
    thresholdY: toY(PUBLIC_BRACKET_OVERLOAD_RULE.threshold, size.height),
    latest: values.at(-1) ?? 0,
    peak: Math.max(...values),
    startsAt,
    endsAt,
  };
}

function toPoint(
  sample: OverloadSample,
  metric: OverloadMetric,
  { size, startsAt, endsAt }: { size: ChartSize; startsAt: number; endsAt: number },
): string {
  const x = ((sample.at - startsAt) / (endsAt - startsAt)) * size.width;

  return `${round(x)},${toY(sample[metric], size.height)}`;
}

function toY(share: number, height: number): number {
  const clamped = Math.min(1, Math.max(0, share));

  return round(height - clamped * height);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
