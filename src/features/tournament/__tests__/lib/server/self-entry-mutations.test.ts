/**
 * @jest-environment node
 */
import { addSelfEntry } from "@features/tournament/lib/server/entries-mutations";
import { getSelfEntryAvailability } from "@features/tournament/lib/server/entries-queries";
import { createEventSettings, createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const BEFORE_OPENING = new Date("2026-11-13T04:59:00.000Z");

const REGISTRATION_OPENS = new Date("2026-11-13T05:00:00.000Z");

const AT_12_00 = new Date("2026-11-20T17:00:00.000Z");

let visitors: Awaited<ReturnType<typeof createVisitors>> = [];

beforeAll(async () => {
  await createEventSettings();
  visitors = await createVisitors(70);
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

describe("addSelfEntry", () => {
  it("pre-registers the visitor with no registering account, queues the S8 email and audits without an actor", async () => {
    const result = await addSelfEntry(visitors[0].id, REGISTRATION_OPENS);
    const entry = await getPrisma().tournamentEntry.findFirstOrThrow();
    const email = await getPrisma().emailOutbox.findFirstOrThrow();

    const audit = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "kof_entry.add", entityId: entry.id },
    });

    expect(result).toEqual({ status: "added", channel: "pre", emailId: email.id });
    expect(entry).toMatchObject({
      visitorId: visitors[0].id,
      channel: "pre",
      status: "registered",
      registeredById: null,
    });
    expect(email).toMatchObject({ to: "jugador1@example.com", subject: "Tu inscripción al torneo de KOF" });
    expect(audit).toMatchObject({ actorId: null, entityId: entry.id });
    expect(audit.detail).toMatchObject({ visitorId: visitors[0].id, channel: "pre", source: "visitor" });
  });

  it("is idempotent: the second attempt creates no entry and no email", async () => {
    await addSelfEntry(visitors[0].id, REGISTRATION_OPENS);

    expect(await addSelfEntry(visitors[0].id, REGISTRATION_OPENS)).toEqual({ status: "alreadyEntered" });
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
    expect(await getPrisma().emailOutbox.count()).toBe(1);
  });

  it("rejects before the list opens", async () => {
    expect(await addSelfEntry(visitors[0].id, BEFORE_OPENING)).toEqual({
      status: "notOpen",
      opensAt: REGISTRATION_OPENS,
    });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("rejects from noon: the on-site sign-up is made in person", async () => {
    expect(await addSelfEntry(visitors[0].id, AT_12_00)).toEqual({ status: "closed" });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("rejects an excluded visitor without creating anything", async () => {
    await getPrisma().visitor.update({
      where: { id: visitors[0].id },
      data: { excludedAt: new Date(), excludedReason: "Fraude" },
    });

    expect(await addSelfEntry(visitors[0].id, REGISTRATION_OPENS)).toEqual({ status: "excluded" });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("rejects a visitor that does not exist", async () => {
    expect(await addSelfEntry("missing", REGISTRATION_OPENS)).toEqual({ status: "unknownGamertag" });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("rejects when the pre-registration list is full (50)", async () => {
    await fillList(50);

    expect(await addSelfEntry(visitors[60].id, REGISTRATION_OPENS)).toEqual({ status: "preListFull" });
    expect(await getPrisma().tournamentEntry.count()).toBe(50);
  });

  it("rejects when the tournament is full (64)", async () => {
    await fillList(40);
    await fillOnsite(40, 64);

    expect(await addSelfEntry(visitors[66].id, REGISTRATION_OPENS)).toEqual({ status: "tournamentFull" });
    expect(await getPrisma().tournamentEntry.count()).toBe(64);
  });
});

describe("getSelfEntryAvailability", () => {
  it("is open while the pre-registration lasts", async () => {
    expect(await getSelfEntryAvailability(visitors[0].id, REGISTRATION_OPENS)).toBe("open");
  });

  it.each([
    ["notOpen", BEFORE_OPENING],
    ["closed", AT_12_00],
  ])("is %s by the clock", async (expected, now) => {
    expect(await getSelfEntryAvailability(visitors[0].id, now)).toBe(expected);
  });

  it("is full when the list has no room", async () => {
    await fillList(50);

    expect(await getSelfEntryAvailability(visitors[60].id, REGISTRATION_OPENS)).toBe("full");
  });

  it("is excluded for an excluded visitor", async () => {
    await getPrisma().visitor.update({
      where: { id: visitors[0].id },
      data: { excludedAt: new Date(), excludedReason: "Fraude" },
    });

    expect(await getSelfEntryAvailability(visitors[0].id, REGISTRATION_OPENS)).toBe("excluded");
  });
});

async function fillList(count: number) {
  await getPrisma().tournamentEntry.createMany({
    data: visitors.slice(0, count).map((visitor) => ({ visitorId: visitor.id, channel: "pre", status: "registered" })),
  });
}

async function fillOnsite(from: number, to: number) {
  await getPrisma().tournamentEntry.createMany({
    data: visitors.slice(from, to).map((visitor) => ({
      visitorId: visitor.id,
      channel: "onsite",
      status: "checked_in",
      checkedInAt: new Date(),
    })),
  });
}
