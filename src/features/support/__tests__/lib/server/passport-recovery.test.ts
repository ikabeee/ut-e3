/**
 * @jest-environment node
 */
import {
  AGENT_RULE,
  CANDIDATE_LIMIT,
  VISITOR_RULE,
  recoverPassport,
  searchPassports,
} from "@features/support/lib/server/passport-recovery";
import { clearTables, createAccount, createVisitor } from "@features/support/__tests__/lib/server/support-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createVisitorDevice, isActiveDeviceToken } from "@shared/lib/server/visitor-device";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const NOW = new Date("2026-11-20T18:00:00.000Z");

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

describe("searchPassports", () => {
  it.each([
    ["the gamertag", "neo_01"],
    ["the email, without regard to case", "NEO_01@Example.com"],
    ["the full name, without regard to case or repeated spaces", " ana  PÉREZ lópez"],
  ])("finds the passport by %s", async (_name, query) => {
    const result = await searchPassports(agentId, query);

    expect(result).toEqual({
      status: "found",
      candidates: [
        {
          visitorId,
          fullName: "Ana Pérez López",
          gamertag: "Neo_01",
          maskedEmail: "ne***@example.com",
          registeredAt: expect.any(Date),
          standsVisited: 0,
        },
      ],
    });
  });

  it("lists every passport with the same name, with the masked email and the time of the registration", async () => {
    const second = await createVisitor("Trin_02", "Ana Pérez López", "54321");

    await getPrisma().visitor.update({
      where: { id: second.id },
      data: { createdAt: new Date("2026-11-19T15:30:00.000Z") },
    });

    const result = await searchPassports(agentId, "Ana Pérez López");
    const candidates = result.status === "found" ? result.candidates : [];

    expect(candidates.map((candidate) => candidate.gamertag).toSorted()).toEqual(["Neo_01", "Trin_02"]);
    expect(candidates.find((candidate) => candidate.gamertag === "Trin_02")).toMatchObject({
      maskedEmail: "tr***@example.com",
      registeredAt: new Date("2026-11-19T15:30:00.000Z"),
    });
  });

  it("counts the stands visited without the annulled visits, and never shows the PIN or the full email", async () => {
    const stand = await getPrisma().stand.create({ data: { zone: "D", number: 91, studio: 1, groupCode: "101" } });
    const other = await getPrisma().stand.create({ data: { zone: "D", number: 92, studio: 1, groupCode: "101" } });

    await getPrisma().checkIn.create({ data: { visitorId, standId: stand.id } });
    await getPrisma().checkIn.create({
      data: { visitorId, standId: other.id, annulledAt: NOW, annulledReason: "Prueba", annulledById: agentId },
    });

    const result = await searchPassports(agentId, "Neo_01");

    expect(result).toMatchObject({ status: "found", candidates: [{ standsVisited: 1 }] });
    expect(JSON.stringify(result)).not.toContain("12345");
    expect(JSON.stringify(result)).not.toContain("neo_01@example.com");
  });

  it("limits the list of a name shared by too many people", async () => {
    for (let index = 0; index < CANDIDATE_LIMIT + 3; index += 1) {
      await createVisitor(`Clon_${index}`, "Ana Pérez López", String(60000 + index));
    }

    const result = await searchPassports(agentId, "Ana Pérez López");

    expect(result.status === "found" && result.candidates).toHaveLength(CANDIDATE_LIMIT);
  });

  it("does not match a part of a name or of a gamertag, so the desk cannot browse the visitors", async () => {
    await expect(searchPassports(agentId, "Ana")).resolves.toEqual({ status: "notFound" });
    await expect(searchPassports(agentId, "Neo")).resolves.toEqual({ status: "notFound" });
    await expect(searchPassports(agentId, "neo_01@")).resolves.toEqual({ status: "notFound" });
  });

  it("audits a miss without copying an email or a name into the log", async () => {
    await searchPassports(agentId, "nadie@example.com");
    await searchPassports(agentId, "Otra Persona");
    await searchPassports(agentId, "Nadie_9");

    const entries = await getPrisma().auditLog.findMany({
      where: { actorId: agentId },
      orderBy: { createdAt: "asc" },
      select: { action: true, entityType: true, entityId: true },
    });

    expect(entries.map((entry) => entry.entityId).toSorted()).toEqual(["Nadie_9", "email", "name"]);
    expect(entries.every((entry) => entry.action === "passport_recovery_failed")).toBe(true);
  });
});

describe("recoverPassport", () => {
  it("issues a link for the chosen visitor and stores only the hash of its token", async () => {
    const result = await recoverPassport(agentId, visitorId, NOW);

    expect(result).toMatchObject({ status: "recovered", fullName: "Ana Pérez López", gamertag: "Neo_01" });

    const claimPath = result.status === "recovered" ? result.claimPath : "";
    const token = claimPath.replace("/passport/claim/", "");
    const device = await getPrisma().visitorDevice.findUniqueOrThrow({ where: { visitorId } });

    expect(token).toHaveLength(43);
    expect(device.token).not.toBe(token);
    expect(device.token).toMatch(/^[0-9a-f]{64}$/);
    expect(await isActiveDeviceToken(token)).toBe(true);
  });

  it("replaces the previous device, which loses access", async () => {
    const previousToken = await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));

    const result = await recoverPassport(agentId, visitorId, NOW);

    expect(result.status).toBe("recovered");
    expect(await isActiveDeviceToken(previousToken)).toBe(false);
    expect(await getPrisma().visitorDevice.count({ where: { visitorId } })).toBe(1);
  });

  it("audits the recovery with the agent and the visitor", async () => {
    await recoverPassport(agentId, visitorId, NOW);

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

  it("answers not found for an id that does not exist, issues nothing and audits it", async () => {
    expect(await recoverPassport(agentId, "no-existe", NOW)).toEqual({ status: "notFound" });
    expect(await getPrisma().visitorDevice.count()).toBe(0);
    expect(
      await getPrisma().auditLog.findMany({
        where: { actorId: agentId },
        select: { action: true, actorId: true, entityType: true },
      }),
    ).toEqual([{ action: "passport_recovery_failed", actorId: agentId, entityType: "visitor_lookup" }]);
  });

  it("allows 3 recoveries of the same visitor per hour and refuses the 4th, auditing it", async () => {
    for (let attempt = 0; attempt < VISITOR_RULE.limit; attempt += 1) {
      expect((await recoverPassport(agentId, visitorId, NOW)).status).toBe("recovered");
    }

    expect(await recoverPassport(agentId, visitorId, NOW)).toEqual({ status: "visitorLimit" });
    expect(await getPrisma().auditLog.count({ where: { actorId: agentId, action: "passport_recovery_limited" } })).toBe(
      1,
    );
  });

  it("counts the visitors apart and starts again in the next hour", async () => {
    const other = await createVisitor("Trin_02", "Luis Gómez", "54321");

    for (let attempt = 0; attempt < VISITOR_RULE.limit; attempt += 1) await recoverPassport(agentId, visitorId, NOW);

    const otherResult = await recoverPassport(agentId, other.id, NOW);
    const nextHour = await recoverPassport(agentId, visitorId, new Date(NOW.getTime() + VISITOR_RULE.windowMs));

    expect(otherResult.status).toBe("recovered");
    expect(nextHour.status).toBe("recovered");
  });

  it("keeps the agent rule at 30 searches or recoveries every 10 minutes", () => {
    expect(AGENT_RULE).toEqual({ limit: 30, windowMs: 10 * 60 * 1000 });
  });
});
