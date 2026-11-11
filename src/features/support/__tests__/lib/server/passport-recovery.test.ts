/**
 * @jest-environment node
 */
import { AGENT_RULE, VISITOR_RULE, recoverPassport } from "@features/support/lib/server/passport-recovery";
import { clearTables, createAccount, createVisitor } from "@features/support/__tests__/lib/server/support-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createVisitorDevice, isActiveDeviceToken } from "@shared/lib/server/visitor-device";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const NOW = new Date("2026-11-20T18:00:00.000Z");

const IDENTITY = { fullName: "Ana Pérez López", gamertag: "Neo_01" };

let agentCount = 0;

let agentId = "";

let visitorId = "";

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The audit log cannot be emptied, so every test has its own agent and reads only the entries of that agent.
beforeEach(async () => {
  await clearTables();
  agentCount += 1;
  agentId = (await createAccount(`atencion-${agentCount}@ut.mx`, "help_desk")).id;
  visitorId = (await createVisitor("Neo_01", "Ana Pérez López")).id;
});

describe("recoverPassport", () => {
  it("issues a link for the matching visitor and stores only the hash of its token", async () => {
    const result = await recoverPassport(agentId, IDENTITY, NOW);

    expect(result).toMatchObject({ status: "recovered", fullName: "Ana Pérez López", gamertag: "Neo_01" });

    const claimPath = result.status === "recovered" ? result.claimPath : "";
    const token = claimPath.replace("/passport/claim/", "");
    const device = await getPrisma().visitorDevice.findUniqueOrThrow({ where: { visitorId } });

    expect(token).toHaveLength(43);
    expect(device.token).not.toBe(token);
    expect(device.token).toMatch(/^[0-9a-f]{64}$/);
    expect(await isActiveDeviceToken(token)).toBe(true);
  });

  it("matches the full name without regard to case or spacing, and the gamertag without regard to case", async () => {
    const result = await recoverPassport(agentId, { fullName: " ana  PÉREZ lópez", gamertag: "neo_01" }, NOW);

    expect(result.status).toBe("recovered");
  });

  it("replaces the previous device, which loses access", async () => {
    const previousToken = await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));

    const result = await recoverPassport(agentId, IDENTITY, NOW);

    expect(result.status).toBe("recovered");
    expect(await isActiveDeviceToken(previousToken)).toBe(false);
    expect(await getPrisma().visitorDevice.count({ where: { visitorId } })).toBe(1);
  });

  it("audits the recovery with the agent and the visitor", async () => {
    await recoverPassport(agentId, IDENTITY, NOW);

    const entries = await getPrisma().auditLog.findMany({ where: { actorId: agentId } });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      actorId: agentId,
      action: "passport_recovered",
      entityType: "visitor",
      entityId: visitorId,
    });
    expect(entries[0].createdAt).toBeInstanceOf(Date);
  });

  it("answers the same for a wrong name as for a gamertag that does not exist, and audits both", async () => {
    const wrongName = await recoverPassport(agentId, { fullName: "Otra Persona", gamertag: "Neo_01" }, NOW);
    const unknown = await recoverPassport(agentId, { fullName: "Ana Pérez López", gamertag: "Nadie" }, NOW);

    expect(wrongName).toEqual({ status: "identityMismatch" });
    expect(unknown).toEqual({ status: "identityMismatch" });
    expect(await getPrisma().visitorDevice.count()).toBe(0);
    expect(
      await getPrisma().auditLog.findMany({
        where: { actorId: agentId },
        select: { action: true, actorId: true, entityType: true },
      }),
    ).toEqual([
      { action: "passport_recovery_failed", actorId: agentId, entityType: "visitor_lookup" },
      { action: "passport_recovery_failed", actorId: agentId, entityType: "visitor_lookup" },
    ]);
  });

  it("allows 3 recoveries of the same visitor per hour and refuses the 4th, auditing it", async () => {
    for (let attempt = 0; attempt < VISITOR_RULE.limit; attempt += 1) {
      expect((await recoverPassport(agentId, IDENTITY, NOW)).status).toBe("recovered");
    }

    expect(await recoverPassport(agentId, IDENTITY, NOW)).toEqual({ status: "visitorLimit" });
    expect(await getPrisma().auditLog.count({ where: { actorId: agentId, action: "passport_recovery_limited" } })).toBe(
      1,
    );
  });

  it("counts the visitors apart and starts again in the next hour", async () => {
    await createVisitor("Trin_02", "Luis Gómez", "54321");

    for (let attempt = 0; attempt < VISITOR_RULE.limit; attempt += 1) await recoverPassport(agentId, IDENTITY, NOW);

    const other = await recoverPassport(agentId, { fullName: "Luis Gómez", gamertag: "Trin_02" }, NOW);
    const nextHour = await recoverPassport(agentId, IDENTITY, new Date(NOW.getTime() + VISITOR_RULE.windowMs));

    expect(other.status).toBe("recovered");
    expect(nextHour.status).toBe("recovered");
  });

  it("keeps the agent rule at 30 recoveries every 10 minutes", () => {
    expect(AGENT_RULE).toEqual({ limit: 30, windowMs: 10 * 60 * 1000 });
  });
});
