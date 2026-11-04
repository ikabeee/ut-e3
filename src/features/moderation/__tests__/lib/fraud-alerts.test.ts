import { findFewStandVisitors, findTopScoreBursts } from "@features/moderation/lib/fraud-alerts";
import { isRaffleStarted, parseReason } from "@features/moderation/lib/moderation-input";

const THRESHOLDS = { topScoreCount: 12, windowMinutes: 10, singleVisitMax: 1 };

const START = Date.parse("2026-11-20T19:00:00.000Z");

function votesEvery(count: number, stepMs: number, standId = "stand-a") {
  return Array.from({ length: count }, (_, index) => ({
    standId,
    createdAt: new Date(START + index * stepMs).toISOString(),
  }));
}

describe("findTopScoreBursts (RF-45)", () => {
  it("alerts a stand with 12 perfect votes in 10 minutes and not one with 11 (UT-AD-05)", () => {
    const twelve = votesEvery(12, 50_000);

    expect(findTopScoreBursts(twelve, THRESHOLDS)).toEqual([
      { standId: "stand-a", count: 12, startsAt: twelve[0].createdAt, endsAt: twelve[11].createdAt },
    ]);
    expect(findTopScoreBursts(votesEvery(11, 50_000), THRESHOLDS)).toEqual([]);
  });

  it("does not count votes that fall outside the lapse", () => {
    expect(findTopScoreBursts(votesEvery(12, 60_000), THRESHOLDS)).toEqual([]);
  });

  it("reports each stand apart, the busiest first, in any order of arrival", () => {
    const votes = [...votesEvery(12, 1000, "stand-a"), ...votesEvery(15, 1000, "stand-b")].reverse();

    expect(findTopScoreBursts(votes, THRESHOLDS).map((burst) => [burst.standId, burst.count])).toEqual([
      ["stand-b", 15],
      ["stand-a", 12],
    ]);
  });
});

describe("findFewStandVisitors (RF-45)", () => {
  it("lists a visitor with one check-in and not one with two (UT-AD-06)", () => {
    const visitors = [
      { visitorId: "one", visitCount: 1 },
      { visitorId: "two", visitCount: 2 },
      { visitorId: "none", visitCount: 0 },
    ];

    expect(findFewStandVisitors(visitors, THRESHOLDS)).toEqual([{ visitorId: "one", visitCount: 1 }]);
    expect(findFewStandVisitors(visitors, { singleVisitMax: 2 }).map((visitor) => visitor.visitorId)).toEqual([
      "one",
      "two",
    ]);
  });
});

describe("parseReason and isRaffleStarted (RF-46)", () => {
  function formWith(reason: string) {
    const form = new FormData();

    form.set("reason", reason);

    return form;
  }

  it("requires a reason of 5 to 280 characters and collapses the spaces", () => {
    expect(parseReason(formWith("  Visita   duplicada "))).toEqual({ isValid: true, reason: "Visita duplicada" });
    expect(parseReason(formWith("abc"))).toEqual({ isValid: false });
    expect(parseReason(formWith("x".repeat(281)))).toEqual({ isValid: false });
  });

  it("freezes the tickets from the start of the raffle", () => {
    const startsAt = new Date(START);

    expect(isRaffleStarted(startsAt, new Date(START - 1))).toBe(false);
    expect(isRaffleStarted(startsAt, new Date(START))).toBe(true);
  });
});
