/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { unexcludeVisitorAction } from "@features/moderation/lib/moderation-actions";
import { MODERATION_COPY } from "@features/moderation/lib/moderation-copy";
import { annulCheckIn, excludeVisitor, unexcludeVisitor } from "@features/moderation/lib/server/moderation-mutations";
import {
  AFTER_RAFFLE,
  BEFORE_RAFFLE,
  createEventSettings,
  createStands,
  createSysadmin,
  createVisitor,
  ticketsOf,
  visitStands,
} from "@features/moderation/__tests__/lib/server/moderation-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString("base64");

let sysadminId = "";

let standIds: string[] = [];

let pinCounter = 40_000;

beforeAll(async () => {
  await createEventSettings();
  standIds = (await createStands(9)).map((stand) => stand.id);
  sysadminId = (await createSysadmin()).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

async function visitorWithNineVisits(gamertag: string) {
  const visitor = await newVisitor(gamertag);

  await visitStands({ visitorId: visitor.id, standIds });

  return visitor;
}

async function newVisitor(gamertag: string) {
  pinCounter += 1;

  return createVisitor(gamertag, String(pinCounter));
}

async function unexcludeAudits(visitorId: string) {
  return getPrisma().auditLog.findMany({ where: { action: "visitor.unexclude", entityId: visitorId } });
}

describe("unexcludeVisitor", () => {
  it("clears the exclusion and brings back the tickets it voided, before the raffle", async () => {
    const visitor = await visitorWithNineVisits("Back");

    await excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Sin motivo real", now: BEFORE_RAFFLE });
    expect((await ticketsOf(visitor.id)).map((ticket) => ticket.status)).toEqual(["voided"]);

    const result = await unexcludeVisitor({ actorId: sysadminId, targetId: visitor.id, now: BEFORE_RAFFLE });
    const saved = await getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } });
    const [entry] = await unexcludeAudits(visitor.id);

    expect(result).toEqual({ status: "unexcluded", reactivatedTickets: 1, ticketsFrozen: false });
    expect(saved).toMatchObject({ excludedAt: null, excludedReason: null });
    expect((await ticketsOf(visitor.id)).map((ticket) => ticket.status)).toEqual(["active"]);
    expect(entry).toMatchObject({ actorId: sysadminId, entityId: visitor.id });
    expect(entry.detail).toEqual({ previousReason: "Sin motivo real", reactivatedTickets: 1, ticketsFrozen: false });
  });

  it("leaves a ticket voided by an annulment voided: the visitor no longer reaches its milestone", async () => {
    const visitor = await visitorWithNineVisits("Short");
    const checkIn = await getPrisma().checkIn.findFirstOrThrow({ where: { visitorId: visitor.id } });

    // Before the exclusion: with nine visits the ticket of the milestone 9 exists, and the annulment voids it.
    await annulCheckIn({ actorId: sysadminId, targetId: checkIn.id, reason: "Visita duplicada", now: BEFORE_RAFFLE });
    await excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Sin motivo real", now: BEFORE_RAFFLE });
    await unexcludeVisitor({ actorId: sysadminId, targetId: visitor.id, now: BEFORE_RAFFLE });

    expect((await ticketsOf(visitor.id)).map((ticket) => ticket.status)).toEqual(["voided"]);
  });

  it("only clears the exclusion once the raffle started, because the tickets were never voided", async () => {
    const visitor = await visitorWithNineVisits("Frozen");

    await excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Sin motivo real", now: AFTER_RAFFLE });
    await getPrisma().raffleTicket.updateMany({ where: { visitorId: visitor.id }, data: { status: "voided" } });

    const result = await unexcludeVisitor({ actorId: sysadminId, targetId: visitor.id, now: AFTER_RAFFLE });

    expect(result).toEqual({ status: "unexcluded", reactivatedTickets: 0, ticketsFrozen: true });
    expect((await ticketsOf(visitor.id)).map((ticket) => ticket.status)).toEqual(["voided"]);
    await expect(getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } })).resolves.toMatchObject({
      excludedAt: null,
    });
  });

  it("refuses a visitor that is not excluded and writes nothing", async () => {
    const visitor = await newVisitor("Free");

    await expect(unexcludeVisitor({ actorId: sysadminId, targetId: visitor.id, now: BEFORE_RAFFLE })).resolves.toEqual({
      status: "notExcluded",
    });
    await expect(unexcludeAudits(visitor.id)).resolves.toEqual([]);
  });

  it("refuses a visitor that does not exist", async () => {
    await expect(unexcludeVisitor({ actorId: sysadminId, targetId: "missing", now: BEFORE_RAFFLE })).resolves.toEqual({
      status: "notFound",
    });
  });
});

describe("unexcludeVisitorAction", () => {
  it("sends anyone but the sysadmin to the login and leaves the exclusion", async () => {
    const visitor = await newVisitor("Locked");

    await excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Sin motivo real", now: BEFORE_RAFFLE });
    await signInAs("kof_admin");

    const form = new FormData();

    form.set("visitorId", visitor.id);

    await expect(unexcludeVisitorAction(null, form)).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    await expect(getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } })).resolves.toMatchObject({
      excludedReason: "Sin motivo real",
    });
  });

  it("answers done for the sysadmin and an error when the visitor is not excluded", async () => {
    const visitor = await newVisitor("Action");
    const form = new FormData();

    form.set("visitorId", visitor.id);
    await excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Sin motivo real", now: BEFORE_RAFFLE });
    await signInAs("sysadmin");

    await expect(unexcludeVisitorAction(null, form)).resolves.toMatchObject({ status: "done" });
    await expect(unexcludeVisitorAction(null, form)).resolves.toEqual({
      status: "error",
      message: MODERATION_COPY.errors.notExcluded,
    });
  });
});
