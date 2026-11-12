import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import type { BurstVisit, StandVisit, VoteRatings } from "@features/moderation/lib/types";
import { formatTimeOfDay } from "@shared/lib/date-time";

const COPY = MODERATION_COPY.selection;

/** A visit that the sysadmin can tick in a list, with the link to review the passport of its visitor. */
export interface SelectableVisit {
  checkInId: string;
  title: string;
  detail: string;
  /** The `?q=` search that opens the passport of the visitor. */
  reviewHref: string;
}

/** A visit of a burst: gamertag, masked email and time, with the three ratings. */
export function buildBurstSelectableVisit(visit: BurstVisit): SelectableVisit {
  return {
    checkInId: visit.checkInId,
    title: COPY.row(visit.gamertag, visit.maskedEmail, formatTimeOfDay(visit.at)),
    detail: describeRatings(visit.ratings),
    reviewHref: buildReviewHref(visit.gamertag),
  };
}

/** A valid visit of the "Por stand" view. */
export function buildStandSelectableVisit(visit: StandVisit): SelectableVisit {
  return {
    checkInId: visit.checkInId,
    title: `${visit.gamertag} · ${formatTimeOfDay(visit.at)}`,
    detail: visit.ratings ? describeRatings(visit.ratings) : MODERATION_COPY.byStand.noVote,
    reviewHref: buildReviewHref(visit.gamertag),
  };
}

export function describeRatings(ratings: VoteRatings): string {
  return COPY.ratings(ratings.game, ratings.stand, ratings.art);
}

function buildReviewHref(gamertag: string): string {
  return `?q=${encodeURIComponent(gamertag)}`;
}
