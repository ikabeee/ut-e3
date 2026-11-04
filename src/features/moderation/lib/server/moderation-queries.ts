import "server-only";
import { formatAdminStandCode } from "@features/games/lib/stand-code";
import { findFewStandVisitors, findTopScoreBursts } from "@features/moderation/lib/fraud-alerts";
import type { FraudAlerts, FraudThresholds, ModerationVisitor } from "@features/moderation/lib/types";
import { VALID_CHECK_IN_WHERE } from "@features/visitors/lib/server/milestone-tickets";
import type { Prisma } from "@generated/prisma/client";
import { hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

/** How many visitors the alert of few stands lists; the total is shown apart. */
export const FEW_STAND_VISITOR_LIMIT = 50;

const PIN_PATTERN = /^\d{5}$/;

// What counts for the alerts: visits that were not annulled, of visitors that were not excluded (RF-46).
const COUNTED_CHECK_IN = { ...VALID_CHECK_IN_WHERE, visitor: { excludedAt: null } };

const STAND_CODE_FIELDS = { zone: true, number: true, studio: true, groupCode: true } as const;

const VISITOR_FIELDS = {
  id: true,
  gamertag: true,
  fullName: true,
  excludedAt: true,
  excludedReason: true,
  checkIns: {
    orderBy: { checkedInAt: "asc" },
    select: {
      id: true,
      checkedInAt: true,
      annulledAt: true,
      annulledReason: true,
      annulledBy: { select: { name: true } },
      stand: { select: STAND_CODE_FIELDS },
    },
  },
  raffleTickets: { orderBy: { number: "asc" }, select: { number: true, milestone: true, status: true } },
} satisfies Prisma.VisitorSelect;

type VisitorRow = Prisma.VisitorGetPayload<{ select: typeof VISITOR_FIELDS }>;

/** The two alerts of possible fraud with the thresholds of event_settings (RF-45). */
export async function getFraudAlerts(): Promise<FraudAlerts> {
  const thresholds = await getFraudThresholds();

  const [votes, stands, visitCounts] = await Promise.all([
    getPrisma().vote.findMany({
      where: { gameRating: 5, standRating: 5, artRating: 5, checkIn: COUNTED_CHECK_IN },
      select: { standId: true, createdAt: true },
    }),
    getPrisma().stand.findMany({ select: { id: true, ...STAND_CODE_FIELDS } }),
    getPrisma().checkIn.groupBy({ by: ["visitorId"], where: COUNTED_CHECK_IN, _count: { _all: true } }),
  ]);

  const codes = new Map(stands.map((stand) => [stand.id, formatAdminStandCode(stand)]));

  const bursts = findTopScoreBursts(
    votes.map((vote) => ({ standId: vote.standId, createdAt: vote.createdAt.toISOString() })),
    thresholds,
  );

  const fewStand = findFewStandVisitors(
    visitCounts.map((row) => ({ visitorId: row.visitorId, visitCount: row._count._all })),
    thresholds,
  );

  return {
    thresholds,
    bursts: bursts.map((burst) => ({ ...burst, standCode: codes.get(burst.standId) ?? burst.standId })),
    fewStandVisitors: await describeVisitors(fewStand.slice(0, FEW_STAND_VISITOR_LIMIT), codes),
    fewStandVisitorTotal: fewStand.length,
  };
}

/** A passport by its PIN, gamertag or email, with every visit (also the annulled ones) and its tickets. */
export async function findModerationVisitor(query: string): Promise<ModerationVisitor | null> {
  const text = query.trim();

  if (!text) return null;

  const visitor = await getPrisma().visitor.findFirst({
    where: PIN_PATTERN.test(text)
      ? { pinLookup: hashPinForLookup(text) }
      : { OR: [{ gamertag: text }, { email: text }] },
    select: VISITOR_FIELDS,
  });

  return visitor ? toModerationVisitor(visitor) : null;
}

async function getFraudThresholds(): Promise<FraudThresholds> {
  const settings = await getPrisma().eventSettings.findUniqueOrThrow({
    where: { id: 1 },
    select: { fraudTopScoreCount: true, fraudWindowMinutes: true, fraudSingleVisitMax: true },
  });

  return {
    topScoreCount: settings.fraudTopScoreCount,
    windowMinutes: settings.fraudWindowMinutes,
    singleVisitMax: settings.fraudSingleVisitMax,
  };
}

async function describeVisitors(
  visitors: readonly { visitorId: string; visitCount: number }[],
  codes: ReadonlyMap<string, string>,
): Promise<FraudAlerts["fewStandVisitors"]> {
  const rows = await getPrisma().visitor.findMany({
    where: { id: { in: visitors.map((visitor) => visitor.visitorId) } },
    select: { id: true, gamertag: true, checkIns: { where: VALID_CHECK_IN_WHERE, select: { standId: true } } },
  });

  const byId = new Map(rows.map((row) => [row.id, row]));

  return visitors.map(({ visitorId, visitCount }) => ({
    visitorId,
    visitCount,
    gamertag: byId.get(visitorId)?.gamertag ?? visitorId,
    standCodes: (byId.get(visitorId)?.checkIns ?? []).map((checkIn) => codes.get(checkIn.standId) ?? checkIn.standId),
  }));
}

function toModerationVisitor(visitor: VisitorRow): ModerationVisitor {
  const checkIns = visitor.checkIns.map((checkIn) => ({
    id: checkIn.id,
    standCode: formatAdminStandCode(checkIn.stand),
    checkedInAt: checkIn.checkedInAt.toISOString(),
    annulment: checkIn.annulledAt
      ? {
          at: checkIn.annulledAt.toISOString(),
          reason: checkIn.annulledReason ?? "",
          byName: checkIn.annulledBy?.name ?? "",
        }
      : null,
  }));

  return {
    id: visitor.id,
    gamertag: visitor.gamertag,
    fullName: visitor.fullName,
    validVisitCount: checkIns.filter((checkIn) => !checkIn.annulment).length,
    exclusion: visitor.excludedAt
      ? { at: visitor.excludedAt.toISOString(), reason: visitor.excludedReason ?? "" }
      : null,
    checkIns,
    tickets: visitor.raffleTickets,
  };
}
