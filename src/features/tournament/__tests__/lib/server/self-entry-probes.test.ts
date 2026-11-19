/**
 * @jest-environment node
 */
import { addEntry, addSelfEntry } from "@features/tournament/lib/server/entries-mutations";
import { createEventSettings, createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const REGISTRATION_OPENS = new Date("2026-11-13T05:00:00.000Z");

const ONSITE_STARTS = new Date("2026-11-20T17:00:00.000Z");

let visitors: Awaited<ReturnType<typeof createVisitors>> = [];

let staffId = "";

beforeAll(async () => {
  await createEventSettings();
  visitors = await createVisitors(60);
  staffId = (
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
  await getPrisma().tournamentEntry.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().visitor.updateMany({ data: { excludedAt: null, excludedReason: null } });
});

describe("self-entry probes", () => {
  it("P1: three parallel attempts add one entry, one email and one audit row with no actor", async () => {
    const results = await Promise.all([1, 2, 3].map(() => addSelfEntry(visitors[0].id, REGISTRATION_OPENS)));
    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();
    const audits = await getPrisma().auditLog.findMany({ where: { action: "kof_entry.add", entityId: entry.id } });

    expect(results.filter((result) => result.status === "added")).toHaveLength(1);
    expect(results.filter((result) => result.status === "alreadyEntered")).toHaveLength(2);
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
    expect(await getPrisma().emailOutbox.count()).toBe(1);
    expect(audits).toHaveLength(1);
    expect(audits[0].actorId).toBeNull();
  });

  it("P2: 1 ms before the on-site start it adds, exactly at it the app answers closed", async () => {
    const before = new Date(ONSITE_STARTS.getTime() - 1);

    expect(await addSelfEntry(visitors[0].id, before)).toMatchObject({ status: "added", channel: "pre" });
    expect(await addSelfEntry(visitors[1].id, ONSITE_STARTS)).toEqual({ status: "closed" });
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
  });

  it("P3: with 49 pre entries the next one is added and the one after is refused", async () => {
    await fillPreList(49);

    expect(await addSelfEntry(visitors[55].id, REGISTRATION_OPENS)).toMatchObject({ status: "added" });
    expect(await addSelfEntry(visitors[56].id, REGISTRATION_OPENS)).toEqual({ status: "preListFull" });
    expect(await getPrisma().tournamentEntry.count()).toBe(50);
  });

  it("P4: two visitors racing for the last pre place leave one entry and one refusal", async () => {
    await fillPreList(49);

    const results = await Promise.all([
      addSelfEntry(visitors[55].id, REGISTRATION_OPENS),
      addSelfEntry(visitors[56].id, REGISTRATION_OPENS),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(["added", "preListFull"]);
    expect(await getPrisma().tournamentEntry.count()).toBe(50);
  });

  it("P5: the staff path still adds an excluded visitor, with its actor and no source in the audit", async () => {
    await getPrisma().visitor.update({
      where: { id: visitors[0].id },
      data: { excludedAt: new Date(), excludedReason: "Fraude" },
    });

    const result = await addEntry(staffId, "Jugador1", REGISTRATION_OPENS);
    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();

    const audit = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_entry.add", entityId: entry.id },
    });

    expect(result).toMatchObject({ status: "added", channel: "pre" });
    expect(entry.registeredById).toBe(staffId);
    expect(audit.actorId).toBe(staffId);
    expect(audit.detail).toEqual({ visitorId: visitors[0].id, gamertag: "Jugador1", channel: "pre" });
  });

  it("the self-entry email is queued as kind kof_entry with the entry id", async () => {
    await addSelfEntry(visitors[0].id, REGISTRATION_OPENS);

    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();

    expect(await getPrisma().emailOutbox.findFirstOrThrow()).toMatchObject({
      kind: "kof_entry",
      referenceId: entry.id,
    });
  });
});

async function fillPreList(count: number) {
  await getPrisma().tournamentEntry.createMany({
    data: visitors.slice(0, count).map((visitor) => ({ visitorId: visitor.id, channel: "pre", status: "registered" })),
  });
}
