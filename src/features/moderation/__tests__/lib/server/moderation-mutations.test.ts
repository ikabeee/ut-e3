/**
 * @jest-environment node
 */
import {
  annulCheckIn,
  annulCheckIns,
  excludeVisitor,
  excludeVisitorsOfCheckIns,
} from "@features/moderation/lib/server/moderation-mutations";
import { findModerationVisitor } from "@features/moderation/lib/server/moderation-queries";
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
import { RAFFLE_ELIGIBLE_TICKET_WHERE } from "@features/visitors/lib/server/milestone-tickets";
import { getPassportVisits } from "@features/visitors/lib/server/passport-visits-queries";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");

let standIds: string[] = [];

let sysadminId = "";

let pinCounter = 20000;

beforeAll(async () => {
  await createEventSettings();
  standIds = (await createStands(12)).map((stand) => stand.id);
  sysadminId = (await createSysadmin()).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

async function visitorWithVisits(count: number) {
  pinCounter += 1;

  const visitor = await createVisitor(`Jugador${pinCounter}`, String(pinCounter));

  await visitStands({ visitorId: visitor.id, standIds: standIds.slice(0, count) });

  return visitor;
}

async function firstCheckInOf(visitorId: string) {
  return getPrisma().checkIn.findFirstOrThrow({ where: { visitorId }, orderBy: { standId: "asc" } });
}

describe("annulCheckIn (RF-46)", () => {
  it("keeps the check-in with date, reason and who annulled it, and it stops counting (UT-AD-03)", async () => {
    const visitor = await visitorWithVisits(3);
    const checkIn = await firstCheckInOf(visitor.id);

    const result = await annulCheckIn({
      actorId: sysadminId,
      targetId: checkIn.id,
      reason: "Visita duplicada",
      now: BEFORE_RAFFLE,
    });

    expect(result).toEqual({ status: "annulled", voidedMilestones: [], ticketsFrozen: false });

    const stored = await getPrisma().checkIn.findUniqueOrThrow({ where: { id: checkIn.id } });

    expect(stored).toMatchObject({ annulledAt: BEFORE_RAFFLE, annulledReason: "Visita duplicada" });
    expect(stored.annulledById).toBe(sysadminId);
    await expect(getPrisma().vote.count({ where: { checkInId: checkIn.id } })).resolves.toBe(1);
    await expect(getPassportVisits(visitor.id)).resolves.toMatchObject({ visitCount: 2 });

    const audit = await getPrisma().auditLog.findFirstOrThrow({ where: { entityId: checkIn.id } });

    expect(audit).toMatchObject({ action: "check_in.annul", actorId: sysadminId });
  });

  it("voids the ticket of the milestone in the same transaction (UT-AD-13)", async () => {
    const visitor = await visitorWithVisits(9);

    await expect(ticketsOf(visitor.id)).resolves.toEqual([expect.objectContaining({ milestone: 9, status: "active" })]);

    const result = await annulCheckIn({
      actorId: sysadminId,
      targetId: (await firstCheckInOf(visitor.id)).id,
      reason: "Calificación inflada",
      now: BEFORE_RAFFLE,
    });

    expect(result).toEqual({ status: "annulled", voidedMilestones: [9], ticketsFrozen: false });
    await expect(ticketsOf(visitor.id)).resolves.toEqual([expect.objectContaining({ milestone: 9, status: "voided" })]);
    await expect(getPassportVisits(visitor.id)).resolves.toMatchObject({
      visitCount: 8,
      tickets: [expect.objectContaining({ milestone: 9, voided: true })],
    });
  });

  it("reactivates the same ticket when the visitor reaches the milestone again (UT-AD-14)", async () => {
    const visitor = await visitorWithVisits(9);
    const [ticket] = await ticketsOf(visitor.id);

    await annulCheckIn({
      actorId: sysadminId,
      targetId: (await firstCheckInOf(visitor.id)).id,
      reason: "Visita sin jugar",
      now: BEFORE_RAFFLE,
    });
    await visitStands({ visitorId: visitor.id, standIds: [standIds[9]] });

    await expect(ticketsOf(visitor.id)).resolves.toEqual([{ number: ticket.number, milestone: 9, status: "active" }]);
  });

  it("leaves the tickets frozen once the raffle started (UT-AD-15)", async () => {
    const visitor = await visitorWithVisits(9);

    const result = await annulCheckIn({
      actorId: sysadminId,
      targetId: (await firstCheckInOf(visitor.id)).id,
      reason: "Detectado tarde",
      now: AFTER_RAFFLE,
    });

    expect(result).toEqual({ status: "annulled", voidedMilestones: [], ticketsFrozen: true });
    await expect(ticketsOf(visitor.id)).resolves.toEqual([expect.objectContaining({ status: "active" })]);
  });

  it("refuses to annul twice and answers notFound for an unknown id", async () => {
    const visitor = await visitorWithVisits(1);
    const request = { actorId: sysadminId, reason: "Repetido", now: BEFORE_RAFFLE };
    const { id } = await firstCheckInOf(visitor.id);

    await annulCheckIn({ ...request, targetId: id });

    await expect(annulCheckIn({ ...request, targetId: id })).resolves.toEqual({ status: "alreadyAnnulled" });
    await expect(annulCheckIn({ ...request, targetId: "missing" })).resolves.toEqual({ status: "notFound" });
  });

  it("is refused by the database when the annulment is incomplete (UT-AD-04)", async () => {
    const visitor = await visitorWithVisits(1);
    const { id } = await firstCheckInOf(visitor.id);

    await expect(getPrisma().checkIn.update({ where: { id }, data: { annulledAt: BEFORE_RAFFLE } })).rejects.toThrow(
      /CHECK constraint/,
    );
  });
});

describe("excludeVisitor (RF-46)", () => {
  it("keeps everything, voids the tickets and leaves an audit entry (UT-AD-01)", async () => {
    const visitor = await visitorWithVisits(9);

    const result = await excludeVisitor({
      actorId: sysadminId,
      targetId: visitor.id,
      reason: "Integrante de un equipo",
      now: BEFORE_RAFFLE,
    });

    expect(result).toEqual({ status: "excluded", ticketsFrozen: false });
    await expect(getPrisma().checkIn.count({ where: { visitorId: visitor.id } })).resolves.toBe(9);
    await expect(ticketsOf(visitor.id)).resolves.toEqual([expect.objectContaining({ status: "voided" })]);

    const audit = await getPrisma().auditLog.findFirstOrThrow({ where: { entityId: visitor.id } });

    expect(audit.action).toBe("visitor.exclude");
  });

  it("keeps the tickets of an excluded visitor out of the raffle after it started (UT-RA-12)", async () => {
    const visitor = await visitorWithVisits(9);

    await excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Fraude confirmado", now: AFTER_RAFFLE });

    await expect(ticketsOf(visitor.id)).resolves.toEqual([expect.objectContaining({ status: "active" })]);
    await expect(
      getPrisma().raffleTicket.count({ where: { visitorId: visitor.id, ...RAFFLE_ELIGIBLE_TICKET_WHERE } }),
    ).resolves.toBe(0);
  });

  it("refuses an exclusion without a reason at the database (UT-AD-02)", async () => {
    const visitor = await visitorWithVisits(0);

    await expect(
      getPrisma().visitor.update({ where: { id: visitor.id }, data: { excludedAt: BEFORE_RAFFLE } }),
    ).rejects.toThrow(/CHECK constraint/);
  });

  it("shows the exclusion and the annulled visits to the sysadmin", async () => {
    const visitor = await visitorWithVisits(2);

    await annulCheckIn({
      actorId: sysadminId,
      targetId: (await firstCheckInOf(visitor.id)).id,
      reason: "Revisado",
      now: BEFORE_RAFFLE,
    });
    await excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Revisado", now: BEFORE_RAFFLE });

    const found = await findModerationVisitor(visitor.gamertag);

    expect(found).toMatchObject({ validVisitCount: 1, exclusion: { reason: "Revisado" } });
    expect(found?.checkIns.filter((checkIn) => checkIn.annulment)).toHaveLength(1);
    await expect(findModerationVisitor(String(pinCounter))).resolves.toMatchObject({ id: visitor.id });
    await expect(findModerationVisitor("nadie")).resolves.toBeNull();
    await expect(
      excludeVisitor({ actorId: sysadminId, targetId: visitor.id, reason: "Otra vez", now: BEFORE_RAFFLE }),
    ).resolves.toEqual({ status: "alreadyExcluded" });
  });
});

describe("bulk moderation of ticked visits (RF-46)", () => {
  async function checkInIdsOf(visitorIds: string[]) {
    const rows = await getPrisma().checkIn.findMany({ where: { visitorId: { in: visitorIds } }, select: { id: true } });

    return rows.map((row) => row.id);
  }

  it("annuls each visit once, skips the ones already annulled and audits every one", async () => {
    const first = await visitorWithVisits(1);
    const second = await visitorWithVisits(1);
    const ids = await checkInIdsOf([first.id, second.id]);

    await annulCheckIn({ actorId: sysadminId, targetId: ids[0], reason: "Voto inflado", now: BEFORE_RAFFLE });

    const result = await annulCheckIns({
      actorId: sysadminId,
      checkInIds: [...ids, ids[1]],
      reason: "Revisión en bloque",
      now: BEFORE_RAFFLE,
    });

    expect(result).toEqual({ done: 1, skipped: 1 });
    await expect(
      getPrisma().auditLog.count({ where: { action: "check_in.annul", entityId: { in: ids } } }),
    ).resolves.toBe(2);
  });

  it("excludes each visitor once even when several of their visits are ticked", async () => {
    const visitor = await visitorWithVisits(3);
    const ids = await checkInIdsOf([visitor.id]);

    const result = await excludeVisitorsOfCheckIns({
      actorId: sysadminId,
      checkInIds: ids,
      reason: "Trampa confirmada",
      now: BEFORE_RAFFLE,
    });

    expect(result).toEqual({ done: 1, skipped: 0 });
    await expect(getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } })).resolves.toMatchObject({
      excludedReason: "Trampa confirmada",
    });
    await expect(
      getPrisma().auditLog.count({ where: { action: "visitor.exclude", entityId: visitor.id } }),
    ).resolves.toBe(1);
  });
});
