/**
 * @jest-environment node
 */
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";
import {
  generateTournament,
  resetTournament,
  runTournamentCommand,
  saveTournament,
} from "@features/tournament/lib/server/tournament-mutations";
import { createPlayers, createTestTournament, getMatch } from "@features/tournament/__tests__/tournament-test-utils";
import { createEventSettings, GENERATES_AT } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ACTOR_EMAIL = "kof-admin@ut.mx";

let actorId = "";

beforeAll(async () => {
  await createEventSettings();

  const actor = await getPrisma().account.create({
    data: { email: ACTOR_EMAIL, name: "Administrador de KOF", role: "kof_admin", status: "active", password: "hash" },
  });

  actorId = actor.id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().kofTournament.deleteMany();
});

describe("generateTournament", () => {
  it("does not generate before the configured hour (UT-TO-41)", async () => {
    const result = await generateTournament(actorId, createPlayers(64), new Date(GENERATES_AT.getTime() - 1000));

    expect(result).toEqual({ status: "tooEarly", generatesAt: GENERATES_AT });
    expect(await getPrisma().kofTournament.count()).toBe(0);
  });

  it("stores the bracket with version 0 at the configured hour", async () => {
    const entrants = createPlayers(40);
    const result = await generateTournament(actorId, entrants, GENERATES_AT);
    const stored = await getTournament();

    expect(result.status).toBe("created");
    expect(stored?.version).toBe(0);
    expect(stored?.matches).toHaveLength(63);
    expect(stored?.players.map((player) => player.id).toSorted()).toEqual(
      entrants.map((player) => player.id).toSorted(),
    );
  });

  it("leaves the shuffle in the audit log (RF-59)", async () => {
    await generateTournament(actorId, createPlayers(40), GENERATES_AT);

    const stored = await getTournament();

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_tournament.generate" },
      orderBy: { createdAt: "desc" },
    });

    expect(entry).toMatchObject({ actorId, entityType: "kof_tournament", entityId: "1" });
    expect(entry.detail).toEqual({ players: stored?.players.map((player) => player.id), byes: 24 });
  });

  it("rejects a second generation (UT-TO-09)", async () => {
    await generateTournament(actorId, createPlayers(64), GENERATES_AT);

    const second = await generateTournament(actorId, createPlayers(64), GENERATES_AT);

    expect(second).toEqual({ status: "alreadyGenerated" });
    expect(await getPrisma().kofTournament.count()).toBe(1);
  });

  it("generates only once when two requests arrive together", async () => {
    const results = await Promise.all([
      generateTournament(actorId, createPlayers(64), GENERATES_AT),
      generateTournament(actorId, createPlayers(64), GENERATES_AT),
    ]);

    expect(results.map((result) => result.status).toSorted()).toEqual(["alreadyGenerated", "created"]);
    expect(await getPrisma().kofTournament.count()).toBe(1);
  });

  it("rejects fewer than 32 players and stores nothing", async () => {
    await expect(generateTournament(actorId, createPlayers(31), GENERATES_AT)).rejects.toThrow(TournamentRuleError);
    expect(await getPrisma().kofTournament.count()).toBe(0);
  });
});

describe("runTournamentCommand", () => {
  it("answers notGenerated while there is no bracket", async () => {
    const result = await runTournamentCommand(actorId, { type: "start_match", matchId: "match-1" }, GENERATES_AT);

    expect(result).toEqual({ status: "notGenerated" });
  });

  it("applies the command, raises the version and writes the audit log", async () => {
    await generateTournament(actorId, createPlayers(64), GENERATES_AT);

    const command = { type: "start_match", matchId: "match-1" } as const;
    const result = await runTournamentCommand(actorId, command, GENERATES_AT);
    const stored = await getTournament();

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_tournament.command" },
      orderBy: { createdAt: "desc" },
    });

    expect(result.status).toBe("applied");
    expect(stored?.version).toBe(1);
    expect(stored && getMatch(stored, 1).status).toBe("active");
    expect(entry.detail).toEqual({ command, version: 1 });
  });

  it("passes a rule error through and writes nothing", async () => {
    await generateTournament(actorId, createPlayers(64), GENERATES_AT);

    const before = await getPrisma().auditLog.count({ where: { action: "kof_tournament.command" } });

    await expect(
      runTournamentCommand(actorId, { type: "start_match", matchId: "match-9" }, GENERATES_AT),
    ).rejects.toThrow(TournamentRuleError);
    expect((await getTournament())?.version).toBe(0);
    expect(await getPrisma().auditLog.count({ where: { action: "kof_tournament.command" } })).toBe(before);
  });

  it("keeps both results when the two desks save at the same time", async () => {
    await generateTournament(actorId, createPlayers(64), GENERATES_AT);

    const results = await Promise.all([
      runTournamentCommand(actorId, { type: "start_match", matchId: "match-1" }, GENERATES_AT),
      runTournamentCommand(actorId, { type: "start_match", matchId: "match-31" }, GENERATES_AT),
    ]);

    const stored = await getTournament();

    expect(results.map((result) => result.status)).toEqual(["applied", "applied"]);
    expect(stored?.version).toBe(2);
    expect(stored && [getMatch(stored, 1).status, getMatch(stored, 31).status]).toEqual(["active", "active"]);
  });

  it("lets only one of two identical commands win (UT-TO-16)", async () => {
    await generateTournament(actorId, createPlayers(64), GENERATES_AT);

    const command = { type: "start_match", matchId: "match-1" } as const;

    const results = await Promise.allSettled([
      runTournamentCommand(actorId, command, GENERATES_AT),
      runTournamentCommand(actorId, command, GENERATES_AT),
    ]);

    const rejected = results.filter((result) => result.status === "rejected");

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(TournamentRuleError);
    expect((await getTournament())?.version).toBe(1);
  });
});

describe("saveTournament", () => {
  it("refuses a copy that is older than the stored one", async () => {
    await generateTournament(actorId, createPlayers(64), GENERATES_AT);
    await runTournamentCommand(actorId, { type: "start_match", matchId: "match-1" }, GENERATES_AT);

    const stale = createTestTournament(64);
    const audit = { actorId, action: "kof_tournament.command", detail: {} };
    const saved = await saveTournament(stale, { ...stale, version: stale.version + 1 }, audit);

    expect(saved).toBe(false);
    expect((await getTournament())?.version).toBe(1);
  });
});

describe("getTournament", () => {
  it("answers null while there is no bracket", async () => {
    expect(await getTournament()).toBeNull();
  });

  it("explains a damaged state instead of returning it", async () => {
    await getPrisma().kofTournament.create({ data: { id: 1, state: { phase: "running" }, version: 0 } });

    await expect(getTournament()).rejects.toThrow(TOURNAMENT_COPY.errors.damagedState);
  });
});

describe("resetTournament", () => {
  it("deletes the bracket and its results, and leaves a record in the audit log", async () => {
    await generateTournament(actorId, createPlayers(40), GENERATES_AT);

    const result = await resetTournament(actorId);

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_tournament.reset" },
      orderBy: { createdAt: "desc" },
    });

    expect(result).toEqual({ status: "reset" });
    expect(await getTournament()).toBeNull();
    expect(entry.actorId).toBe(actorId);
    expect(entry.detail).toMatchObject({ players: 40, version: 0 });
  });

  it("counts the finished matches in the record, so it shows what was lost", async () => {
    const created = await generateTournament(actorId, createPlayers(64), GENERATES_AT);

    if (created.status !== "created") throw new Error("Expected a bracket");

    const matchId = getMatch(created.tournament, 1).id;

    await runTournamentCommand(actorId, { type: "start_match", matchId }, GENERATES_AT);
    await runTournamentCommand(actorId, { type: "finish_match", matchId, loserSlot: 1 }, GENERATES_AT);
    await resetTournament(actorId);

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_tournament.reset" },
      orderBy: { createdAt: "desc" },
    });

    expect(entry.detail).toMatchObject({ finishedMatches: 1 });
  });

  it("says there is nothing to reset when no bracket was generated, and writes nothing", async () => {
    const before = await getPrisma().auditLog.count({ where: { action: "kof_tournament.reset" } });

    expect(await resetTournament(actorId)).toEqual({ status: "notGenerated" });
    expect(await getPrisma().auditLog.count({ where: { action: "kof_tournament.reset" } })).toBe(before);
  });

  it("lets the bracket be generated again", async () => {
    await generateTournament(actorId, createPlayers(40), GENERATES_AT);
    await resetTournament(actorId);

    expect((await generateTournament(actorId, createPlayers(48), GENERATES_AT)).status).toBe("created");
    expect((await getTournament())?.players).toHaveLength(48);
  });
});
