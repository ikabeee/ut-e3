import type { FraudThresholds, StandBurst, TopScoreVote, VisitorVisitCount } from "@features/moderation/lib/types";

const MINUTE_MS = 60_000;

/**
 * The stands that received at least `topScoreCount` perfect votes inside any lapse of `windowMinutes` (RF-45,
 * UT-AD-05). Each stand reports its busiest lapse, the most suspicious first.
 */
export function findTopScoreBursts(votes: readonly TopScoreVote[], thresholds: FraudThresholds): StandBurst[] {
  const windowMs = thresholds.windowMinutes * MINUTE_MS;
  const bursts: StandBurst[] = [];

  for (const [standId, times] of groupTimesByStand(votes)) {
    const busiest = findBusiestWindow(times, windowMs);

    if (busiest.count >= thresholds.topScoreCount) bursts.push({ standId, ...busiest });
  }

  return bursts.toSorted(
    (first, second) => second.count - first.count || first.startsAt.localeCompare(second.startsAt),
  );
}

/** The visitors with at least one visit and no more than `singleVisitMax` (RF-45, UT-AD-06). */
export function findFewStandVisitors(
  visitors: readonly VisitorVisitCount[],
  thresholds: Pick<FraudThresholds, "singleVisitMax">,
): VisitorVisitCount[] {
  return visitors.filter((visitor) => visitor.visitCount >= 1 && visitor.visitCount <= thresholds.singleVisitMax);
}

function groupTimesByStand(votes: readonly TopScoreVote[]): Map<string, number[]> {
  const groups = new Map<string, number[]>();

  for (const vote of votes) {
    groups.set(vote.standId, [...(groups.get(vote.standId) ?? []), Date.parse(vote.createdAt)]);
  }

  return new Map([...groups].map(([standId, times]) => [standId, times.toSorted((first, second) => first - second)]));
}

// Two pointers over sorted times: the lapse starts at a vote and holds the votes less than `windowMs` after it.
function findBusiestWindow(times: readonly number[], windowMs: number): Omit<StandBurst, "standId"> {
  let best = { count: 0, first: 0, last: 0 };
  let start = 0;

  for (let end = 0; end < times.length; end += 1) {
    while (times[end] - times[start] >= windowMs) start += 1;

    if (end - start + 1 > best.count) best = { count: end - start + 1, first: start, last: end };
  }

  return {
    count: best.count,
    startsAt: new Date(times[best.first] ?? 0).toISOString(),
    endsAt: new Date(times[best.last] ?? 0).toISOString(),
  };
}
