import { buildWinnerEmail } from "@features/raffle/lib/raffle-email";
import { parseDecision, parsePrize, parseSpinRequest } from "@features/raffle/lib/raffle-input";
import { resolvePendingDraw } from "@features/raffle/lib/raffle-pending";
import { getRafflePhase, pickTicketIndex } from "@features/raffle/lib/raffle-rules";
import { isAdminSnapshot, isLiveSnapshot, pickNewerSnapshot } from "@features/raffle/lib/raffle-snapshot";
import type { PendingDraw } from "@features/raffle/lib/types";

const STARTS_AT = new Date("2026-11-20T23:00:00.000Z");

const ID = "8f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b";

function formOf(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.set(name, value));

  return form;
}

const draw: PendingDraw = {
  id: ID,
  ticketNumber: 7,
  gamertag: "Neo",
  drawnAt: STARTS_AT.toISOString(),
  drawnById: "admin-1",
  drawnByName: "Animador",
};

describe("getRafflePhase", () => {
  it("is upcoming a minute before 18:00 and open at 18:00 (UT-RA-01)", () => {
    expect(getRafflePhase({ startsAt: STARTS_AT, closedAt: null }, new Date(STARTS_AT.getTime() - 60_000))).toBe(
      "upcoming",
    );
    expect(getRafflePhase({ startsAt: STARTS_AT, closedAt: null }, STARTS_AT)).toBe("open");
  });

  it("stays closed once closed, whatever the hour (RF-54)", () => {
    expect(getRafflePhase({ startsAt: STARTS_AT, closedAt: STARTS_AT }, new Date(0))).toBe("closed");
  });
});

describe("pickTicketIndex", () => {
  it("uses the index the generator gives and refuses one outside the range", () => {
    expect(pickTicketIndex(3, () => 2)).toBe(2);
    expect(() => pickTicketIndex(3, () => 3)).toThrow(RangeError);
    expect(() => pickTicketIndex(3, () => 1.5)).toThrow(RangeError);
  });
});

describe("raffle forms", () => {
  it("accepts a request id from crypto.randomUUID and nothing else", () => {
    expect(parseSpinRequest(formOf({ requestId: ID }))).toEqual({ ok: true, value: ID });
    expect(parseSpinRequest(formOf({ requestId: "otro" })).ok).toBe(false);
    expect(parseSpinRequest(new FormData()).ok).toBe(false);
  });

  it("accepts only winner or discarded as a decision", () => {
    expect(parseDecision(formOf({ drawId: ID, outcome: "winner" }))).toEqual({
      ok: true,
      value: { drawId: ID, outcome: "winner" },
    });
    expect(parseDecision(formOf({ drawId: ID, outcome: "pending" })).ok).toBe(false);
  });

  it("collapses the spaces of a prize and limits it to 80 characters", () => {
    expect(parsePrize(formOf({ drawId: ID, prizeName: "  Taza   UT " }))).toEqual({
      ok: true,
      value: { drawId: ID, prizeName: "Taza UT" },
    });
    expect(parsePrize(formOf({ drawId: ID, prizeName: "x".repeat(80) })).ok).toBe(true);
    expect(parsePrize(formOf({ drawId: ID, prizeName: "x".repeat(81) })).ok).toBe(false);
  });
});

describe("buildWinnerEmail", () => {
  it("carries the gamertag, the ticket number and the hour in Cancun time (RF-53)", () => {
    const email = buildWinnerEmail({ to: "neo@example.com", gamertag: "Neo", ticketNumber: 7, decidedAt: STARTS_AT });

    expect(email.to).toBe("neo@example.com");
    expect(email.text).toContain("Neo");
    expect(email.text).toContain("#7");
    expect(email.text).toContain("18:00");
  });
});

describe("resolvePendingDraw", () => {
  it("shows the ticket just drawn until a newer poll arrives", () => {
    const optimistic = { kind: "drawn", draw, baseRevision: 3 } as const;

    expect(resolvePendingDraw({ pending: null, revision: 3 }, optimistic)).toBe(draw);
    expect(resolvePendingDraw({ pending: null, revision: 4 }, optimistic)).toBeNull();
  });

  it("hides the ticket just decided, even if an older poll still has it", () => {
    const optimistic = { kind: "decided", drawId: ID, baseRevision: 4 } as const;

    expect(resolvePendingDraw({ pending: draw, revision: 4 }, optimistic)).toBeNull();
    expect(resolvePendingDraw({ pending: draw, revision: 6 }, optimistic)).toBe(draw);
  });
});

describe("raffle snapshots", () => {
  const base = { phase: "open", startsAt: "", latest: null, winners: [], revision: 2, serverNow: 10 };

  it("keeps the higher revision, and the later clock for the same revision", () => {
    expect(pickNewerSnapshot(base, { ...base, revision: 1, serverNow: 99 })).toBe(base);

    const later = { ...base, serverNow: 11 };

    expect(pickNewerSnapshot(base, later)).toBe(later);
  });

  it("recognizes the answers of both endpoints", () => {
    expect(isLiveSnapshot(base)).toBe(true);
    expect(isLiveSnapshot({ ...base, revision: "2" })).toBe(false);
    expect(isAdminSnapshot({ ...base, pending: null, activeTickets: 3 })).toBe(true);
    expect(isAdminSnapshot(base)).toBe(false);
  });
});
