/**
 * @jest-environment node
 */
import {
  addEntry,
  checkInEntry,
  closeCheckInIfDue,
  explainInsertFailure,
  generateFromEntries,
} from "@features/tournament/lib/server/entries-mutations";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import { createEventSettings, createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

// All hours are Cancun (UTC-5); the event is on 20 November.
const BEFORE_OPENING = new Date("2026-11-13T04:59:00.000Z");

const REGISTRATION_OPENS = new Date("2026-11-13T05:00:00.000Z");

const AT_11_59 = new Date("2026-11-20T16:59:00.000Z");

const AT_12_00 = new Date("2026-11-20T17:00:00.000Z");

const AT_12_20 = new Date("2026-11-20T17:20:00.000Z");

const AT_12_30 = new Date("2026-11-20T17:30:00.000Z");

const AT_12_45 = new Date("2026-11-20T17:45:00.000Z");

const AT_12_46 = new Date("2026-11-20T17:46:00.000Z");

const AT_12_50 = new Date("2026-11-20T17:50:00.000Z");

const AT_12_54 = new Date("2026-11-20T17:54:00.000Z");

const AT_12_55 = new Date("2026-11-20T17:55:00.000Z");

let actorId = "";

let visitors: Awaited<ReturnType<typeof createVisitors>> = [];

beforeAll(async () => {
  await createEventSettings();
  visitors = await createVisitors(70);
  actorId = (
    await getPrisma().account.create({
      data: {
        email: "kof-admin@ut.mx",
        name: "Administrador de KOF",
        role: "kof_admin",
        status: "active",
        password: "hash",
      },
    })
  ).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().kofTournament.deleteMany();
  await getPrisma().tournamentEntry.deleteMany();
});

describe("addEntry", () => {
  it("rejects the list before it opens on 13 November (UT-TO-25)", async () => {
    const result = await addEntry(actorId, "Jugador1", BEFORE_OPENING);

    expect(result).toEqual({ status: "notOpen", opensAt: REGISTRATION_OPENS });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("adds a pre-registration at the opening hour and records who did it (UT-TO-26)", async () => {
    const result = await addEntry(actorId, "Jugador1", REGISTRATION_OPENS);
    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();

    expect(result).toEqual({ status: "added", channel: "pre" });
    expect(entry).toMatchObject({
      visitorId: visitors[0].id,
      channel: "pre",
      status: "registered",
      checkedInAt: null,
      registeredById: actorId,
    });
  });

  it("finds the gamertag without caring for case or spaces and writes the audit log", async () => {
    await addEntry(actorId, "  jugador2 ", REGISTRATION_OPENS);

    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();

    const audit = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_entry.add", entityId: entry.id },
    });

    expect(entry.visitorId).toBe(visitors[1].id);
    expect(audit.detail).toEqual({ visitorId: visitors[1].id, gamertag: "Jugador2", channel: "pre" });
  });

  it("answers a gamertag that nobody has and creates nothing", async () => {
    expect(await addEntry(actorId, "NoExiste", REGISTRATION_OPENS)).toEqual({ status: "unknownGamertag" });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("does not add the same visitor twice (UT-TO-03)", async () => {
    await addEntry(actorId, "Jugador1", REGISTRATION_OPENS);

    expect(await addEntry(actorId, "Jugador1", AT_11_59)).toEqual({ status: "alreadyEntered" });
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
  });

  it("stops the pre-registration list at 50 (UT-TO-28)", async () => {
    await insertEntries({ preRegistered: 50 });

    expect(await addEntry(actorId, "Jugador51", AT_11_59)).toEqual({ status: "preListFull" });
  });

  it("still registers as pre-registration, without a check-in, one minute before noon (UT-TO-36)", async () => {
    expect(await addEntry(actorId, "Jugador1", AT_11_59)).toEqual({ status: "added", channel: "pre" });
    expect((await getPrisma().tournamentEntry.findFirstOrThrow()).status).toBe("registered");
  });

  it("signs up on site at noon with the check-in already done (UT-TO-37)", async () => {
    const result = await addEntry(actorId, "Jugador1", AT_12_00);
    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();

    expect(result).toEqual({ status: "added", channel: "onsite" });
    expect(entry).toMatchObject({ channel: "onsite", status: "checked_in", checkedInAt: AT_12_00 });
  });

  it("closes the sign-up at 12:45 (UT-TO-39)", async () => {
    expect(await addEntry(actorId, "Jugador1", AT_12_46)).toEqual({ status: "closed" });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("keeps the places of the pre-registered that have not checked in until 12:45 (UT-TO-40)", async () => {
    await insertEntries({ preRegistered: 10, preCheckedIn: 40, onsite: 14 });

    expect(await addEntry(actorId, "Jugador65", AT_12_30)).toEqual({ status: "tournamentFull" });
  });

  it("lets only one of two simultaneous sign-ups take the last place (UT-TO-02)", async () => {
    await insertEntries({ preCheckedIn: 40, onsite: 23 });

    const results = await Promise.all([
      addEntry(actorId, "Jugador64", AT_12_30),
      addEntry(actorId, "Jugador65", AT_12_30),
    ]);

    expect(results.map((result) => result.status).toSorted()).toEqual(["added", "tournamentFull"]);
    expect(await getPrisma().tournamentEntry.count()).toBe(64);
  });
});

describe("checkInEntry", () => {
  it("rejects a check-in before noon (UT-TO-29)", async () => {
    await insertEntries({ preRegistered: 1 });

    expect(await checkInEntry(actorId, pinOf(0), AT_11_59)).toEqual({
      status: "notOpen",
      startsAt: AT_12_00,
    });
    expect((await getPrisma().tournamentEntry.findFirstOrThrow()).status).toBe("registered");
  });

  it("checks the player in with the PIN and records the hour (UT-TO-30)", async () => {
    await insertEntries({ preRegistered: 1 });

    const result = await checkInEntry(actorId, pinOf(0), AT_12_20);
    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();

    expect(result).toEqual({ status: "checkedIn", gamertag: "Jugador1" });
    expect(entry).toMatchObject({ status: "checked_in", checkedInAt: AT_12_20 });
    expect(await getPrisma().auditLog.count({ where: { action: "kof_entry.check_in", entityId: entry.id } })).toBe(1);
  });

  it.each([
    ["a visitor that is not in the list", pinOf(5)],
    ["a PIN that is nobody's", "99999"],
    ["a PIN with letters", "12ab5"],
    ["a PIN that is too short", "123"],
  ])("answers the same for %s and creates nothing (UT-TO-31)", async (_case, pin) => {
    await insertEntries({ preRegistered: 1 });

    expect(await checkInEntry(actorId, pin, AT_12_20)).toEqual({ status: "unknownPin" });
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
  });

  it("rejects the check-in after 12:45 and the entry stays as it was (UT-TO-32)", async () => {
    await insertEntries({ preRegistered: 1 });

    expect(await checkInEntry(actorId, pinOf(0), AT_12_50)).toEqual({ status: "closed" });
    expect((await getPrisma().tournamentEntry.findFirstOrThrow()).status).toBe("registered");
  });

  it("says so when the player already checked in", async () => {
    await insertEntries({ preCheckedIn: 1 });

    expect(await checkInEntry(actorId, pinOf(0), AT_12_20)).toEqual({ status: "alreadyCheckedIn" });
  });

  it("does not check in someone who already did not show up", async () => {
    await insertEntries({ preRegistered: 1 });
    await closeCheckInIfDue(actorId, AT_12_46);

    expect(await checkInEntry(actorId, pinOf(0), AT_12_20)).toEqual({ status: "noShow" });
  });
});

describe("closeCheckInIfDue", () => {
  it("turns the entries without a check-in into no-shows and leaves the rest alone (UT-TO-33)", async () => {
    await insertEntries({ preCheckedIn: 40, preRegistered: 5 });

    expect(await closeCheckInIfDue(actorId, AT_12_45)).toBe(5);

    const statuses = await getPrisma().tournamentEntry.groupBy({ by: ["status"], _count: true });
    const audit = await getPrisma().auditLog.count({ where: { action: "kof_entry.close_check_in" } });

    expect(statuses.map((row) => [row.status, row._count]).toSorted()).toEqual([
      ["checked_in", 40],
      ["no_show", 5],
    ]);
    expect(audit).toBeGreaterThan(0);
  });

  it("does nothing the second time and writes no second audit entry", async () => {
    await insertEntries({ preRegistered: 2 });
    await closeCheckInIfDue(actorId, AT_12_45);

    const before = await getPrisma().auditLog.count({ where: { action: "kof_entry.close_check_in" } });

    expect(await closeCheckInIfDue(actorId, AT_12_46)).toBe(0);
    expect(await getPrisma().auditLog.count({ where: { action: "kof_entry.close_check_in" } })).toBe(before);
  });

  it("follows the configured end of the check-in, not a fixed hour (UT-TO-35)", async () => {
    await insertEntries({ preRegistered: 3 });
    await getPrisma().eventSettings.update({ where: { id: 1 }, data: { kofCheckInEndsAt: AT_12_30 } });

    try {
      expect(await closeCheckInIfDue(actorId, AT_12_20)).toBe(0);
      expect(await getPrisma().tournamentEntry.count({ where: { status: "registered" } })).toBe(3);
      expect(await closeCheckInIfDue(actorId, AT_12_30)).toBe(3);
    } finally {
      await getPrisma().eventSettings.update({ where: { id: 1 }, data: { kofCheckInEndsAt: AT_12_45 } });
    }
  });
});

describe("generateFromEntries", () => {
  it("does not generate before 12:55 (UT-TO-41)", async () => {
    await insertEntries({ preCheckedIn: 40 });

    const result = await generateFromEntries(actorId, AT_12_54);

    expect(result.status).toBe("tooEarly");
    expect(await getPrisma().kofTournament.count()).toBe(0);
  });

  it("closes the check-in and plays only with the players that checked in (UT-TO-42)", async () => {
    await insertEntries({ preCheckedIn: 40, preRegistered: 5 });

    const result = await generateFromEntries(actorId, AT_12_55);
    const tournament = await getTournament();
    const entries = await getPrisma().tournamentEntry.findMany({ where: { status: "checked_in" } });

    expect(result.status).toBe("created");
    expect(tournament?.players).toHaveLength(40);
    expect(tournament?.players.map((player) => player.id).toSorted()).toEqual(
      entries.map((entry) => entry.visitorId).toSorted(),
    );
    expect(tournament?.players.every((player) => /^Jugador\d+$/.test(player.tag))).toBe(true);
    expect(tournament?.matches.filter((match) => match.outcome === "bye")).toHaveLength(24);
    expect(await getPrisma().tournamentEntry.count({ where: { status: "no_show" } })).toBe(5);
  });

  it("refuses to start with fewer than 32 players", async () => {
    await insertEntries({ preCheckedIn: 31 });

    await expect(generateFromEntries(actorId, AT_12_55)).rejects.toThrow(TournamentRuleError);
    expect(await getPrisma().kofTournament.count()).toBe(0);
  });
});

// The counts run first, so a race only reaches the triggers of the table; these are the errors the database gives.
describe("explainInsertFailure", () => {
  it("names a full tournament when the trigger of the 64 places stops the insert", async () => {
    await insertEntries({ preCheckedIn: 40, onsite: 24 });

    const failure = await insertDirectly(64, "onsite");

    expect(explainInsertFailure(failure)).toEqual({ status: "tournamentFull" });
  });

  it("names a full pre-registration list when the trigger of the 50 stops the insert", async () => {
    await insertEntries({ preRegistered: 50 });

    const failure = await insertDirectly(50, "pre");

    expect(explainInsertFailure(failure)).toEqual({ status: "preListFull" });
  });

  it("names a repeated visitor when the unique key stops the insert", async () => {
    await insertEntries({ preRegistered: 1 });

    const failure = await insertDirectly(0, "pre");

    expect(explainInsertFailure(failure)).toEqual({ status: "alreadyEntered" });
  });

  it("does not hide an error that it does not know", () => {
    expect(() => explainInsertFailure(new Error("disk is full"))).toThrow("disk is full");
  });
});

interface EntryPlan {
  preCheckedIn?: number;
  preRegistered?: number;
  onsite?: number;
}

// Creates the entries in order, with the first visitors: the pre-registered first, then the on-site ones.
async function insertEntries(plan: EntryPlan) {
  const rows = [
    ...Array.from({ length: plan.preCheckedIn ?? 0 }, () => ({ channel: "pre", status: "checked_in" })),
    ...Array.from({ length: plan.preRegistered ?? 0 }, () => ({ channel: "pre", status: "registered" })),
    ...Array.from({ length: plan.onsite ?? 0 }, () => ({ channel: "onsite", status: "checked_in" })),
  ];

  for (const [index, row] of rows.entries()) {
    await getPrisma().tournamentEntry.create({
      data: {
        visitorId: visitors[index].id,
        ...row,
        checkedInAt: row.status === "checked_in" ? AT_12_20 : null,
      },
    });
  }
}

function pinOf(index: number): string {
  return String(index + 1).padStart(5, "0");
}

async function insertDirectly(index: number, channel: "pre" | "onsite"): Promise<Error> {
  try {
    await getPrisma().tournamentEntry.create({
      data: {
        visitorId: visitors[index].id,
        channel,
        status: channel === "pre" ? "registered" : "checked_in",
        checkedInAt: channel === "pre" ? null : AT_12_20,
      },
    });
  } catch (cause) {
    return cause instanceof Error ? cause : new Error(String(cause));
  }

  throw new Error("Expected the database to refuse the entry");
}
