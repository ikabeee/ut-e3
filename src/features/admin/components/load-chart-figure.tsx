import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildLoadChart, LOAD_CHART_SIZE, type LoadChart } from "@features/admin/lib/load-chart";
import {
  formatShare,
  PUBLIC_BRACKET_OVERLOAD_RULE,
  type OverloadMetric,
  type OverloadSample,
} from "@features/admin/lib/overload-rule";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface LoadChartFigureProps {
  metric: OverloadMetric;
  history: readonly OverloadSample[];
}

const COPY = ADMIN_COPY.server.charts;

const { width, height } = LOAD_CHART_SIZE;

const THRESHOLD = formatShare(PUBLIC_BRACKET_OVERLOAD_RULE.threshold);

/**
 * The history of one metric (S4): a line against the 85% of the automatic close, so the sysadmin sees whether a peak
 * is a spike or a climb. The numbers are also written out, because a screen reader cannot follow the line.
 */
export function LoadChartFigure({ metric, history }: Readonly<LoadChartFigureProps>) {
  const chart = buildLoadChart(history, metric);
  const title = COPY.titles[metric];

  return (
    <figure className="m-0 grid gap-2" data-testid={`load-chart-${metric}`}>
      <figcaption className="grid gap-1">
        <span className="font-bold">{title}</span>
        {chart ? <ChartSummary chart={chart} /> : <span className="text-sm text-muted">{COPY.empty}</span>}
      </figcaption>
      {chart ? <ChartDrawing chart={chart} label={title} /> : null}
    </figure>
  );
}

function ChartSummary({ chart }: Readonly<{ chart: LoadChart }>) {
  return <span className="text-sm text-muted">{COPY.summary(formatShare(chart.latest), formatShare(chart.peak))}</span>;
}

function ChartDrawing({ chart, label }: Readonly<{ chart: LoadChart; label: string }>) {
  const startsAt = formatTimeOfDay(new Date(chart.startsAt).toISOString());
  const endsAt = formatTimeOfDay(new Date(chart.endsAt).toISOString());

  return (
    <div className="grid gap-1">
      <svg
        role="img"
        aria-label={COPY.description(label, { from: startsAt, to: endsAt }, THRESHOLD)}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-32 w-full border border-border bg-surface md:h-40"
      >
        <path d={chart.area} className="fill-accent/15" />
        <path d={chart.line} vectorEffect="non-scaling-stroke" strokeWidth="2" className="fill-none stroke-accent" />
        <line
          x1="0"
          x2={width}
          y1={chart.thresholdY}
          y2={chart.thresholdY}
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 4"
          className="stroke-danger"
        />
      </svg>
      <div className="flex justify-between gap-3 type-tiny text-muted">
        <span>{startsAt}</span>
        <span className="text-danger">{COPY.threshold(THRESHOLD)}</span>
        <span>{endsAt}</span>
      </div>
    </div>
  );
}
