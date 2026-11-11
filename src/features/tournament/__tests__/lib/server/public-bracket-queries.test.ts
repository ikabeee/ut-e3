/**
 * @jest-environment node
 */
import { setPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-mutations";
import { getPublicBracketEnabled, getPublicSnapshot } from "@features/tournament/lib/server/public-bracket-queries";
import { generateTournament } from "@features/tournament/lib/server/tournament-mutations";
import { createPlayers } from "@features/tournament/__tests__/tournament-test-utils";
import { createEventSettings, GENERATES_AT } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-20T18:00:00.000Z");

let adminId = "";

beforeAll(async () => {
  adminId = (
    await getPrisma().account.create({
      data: { email: "kof-admin@ut.mx", name: "KOF", role: "kof_admin", status: "active", password: "hash" },
    })
  ).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().kofTournament.deleteMany();
  await getPrisma().eventSettings.deleteMany();
});

describe("getPublicSnapshot (S2)", () => {
  it("says it is closed when the settings are missing, which is the safe side", async () => {
    expect(await getPublicSnapshot(NOW)).toEqual({ state: "closed", serverNow: NOW.getTime() });
  });

  it("says the bracket is pending while it does not exist", async () => {
    await createEventSettings();

    expect(await getPublicSnapshot(NOW)).toEqual({ state: "pending", serverNow: NOW.getTime() });
  });

  it("opens with the public bracket once it exists", async () => {
    await createEventSettings();
    await generateTournament(adminId, createPlayers(64), GENERATES_AT);

    const snapshot = await getPublicSnapshot(NOW);

    expect(snapshot.state).toBe("open");

    if (snapshot.state !== "open") throw new Error("Expected an open snapshot");

    expect(snapshot.bracket.matches).toHaveLength(63);
    expect(JSON.stringify(snapshot)).not.toContain("player-");
  });

  it("closes even when the bracket exists, without leaking it", async () => {
    await createEventSettings();
    await generateTournament(adminId, createPlayers(64), GENERATES_AT);
    await getPrisma().eventSettings.update({ where: { id: 1 }, data: { publicBracketEnabled: false } });

    const snapshot = await getPublicSnapshot(NOW);

    expect(snapshot).toEqual({ state: "closed", serverNow: NOW.getTime() });
    expect(JSON.stringify(snapshot)).not.toContain("Tag");
  });

  it("stays closed while it is closed and there is no bracket yet", async () => {
    await createEventSettings();
    await getPrisma().eventSettings.update({ where: { id: 1 }, data: { publicBracketEnabled: false } });

    expect((await getPublicSnapshot(NOW)).state).toBe("closed");
  });
});

describe("setPublicBracketEnabled (S5)", () => {
  it("closes and reopens the public bracket and writes the audit entries", async () => {
    await createEventSettings();

    expect(await getPublicBracketEnabled()).toBe(true);

    await setPublicBracketEnabled(adminId, false);

    expect(await getPublicBracketEnabled()).toBe(false);

    await setPublicBracketEnabled(adminId, true);

    expect(await getPublicBracketEnabled()).toBe(true);

    const entries = await getPrisma().auditLog.findMany({
      where: { action: "kof_tournament.public_bracket", actorId: adminId },
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    expect(
      entries.map((entry) => entry.detail).toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    ).toEqual([{ enabled: false }, { enabled: true }]);
  });

  it("writes nothing when the value does not change", async () => {
    await createEventSettings();

    const before = await getPrisma().auditLog.count({ where: { action: "kof_tournament.public_bracket" } });

    await setPublicBracketEnabled(adminId, true);

    expect(await getPrisma().auditLog.count({ where: { action: "kof_tournament.public_bracket" } })).toBe(before);
  });

  it("explains that the settings are missing", async () => {
    await expect(setPublicBracketEnabled(adminId, false)).rejects.toThrow("horarios del evento");
  });
});
