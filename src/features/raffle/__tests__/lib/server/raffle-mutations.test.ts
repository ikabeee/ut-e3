/**
 * @jest-environment node
 */
import { closeRaffle, decideDraw, registerPrize, spinRaffle } from "@features/raffle/lib/server/raffle-mutations";
import {
  createEventSettings,
  createRaffleAdmin,
  createVisitorWithTickets,
  DURING_RAFFLE,
  nextRequestId,
  RAFFLE_STARTS_AT,
} from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let adminId = "";

beforeAll(async () => {
  await createEventSettings();
  // The draws are insert-only in the real database (trigger); these tests start each case from an empty raffle, so
  // this test database alone lets them be removed. raffle-draws-table.test.ts checks the trigger itself.
  await getPrisma().$executeRawUnsafe('DROP TRIGGER "raffle_draws_no_delete"');
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The audit log is insert-only and points at its actor, so every test has its own administrator.
beforeEach(async () => {
  await getPrisma().raffleDraw.deleteMany();
  await getPrisma().raffleTicket.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().eventSettings.update({ where: { id: 1 }, data: { raffleClosedAt: null } });
  adminId = (await createRaffleAdmin()).id;
});

describe("spinRaffle", () => {
  it("UT-RA-01: refuses to spin before the raffle starts", async () => {
    await createVisitorWithTickets("Neo");

    const result = await spin({ now: new Date(RAFFLE_STARTS_AT.getTime() - 60_000) });

    expect(result).toEqual({ status: "notStarted", startsAt: RAFFLE_STARTS_AT });
    expect(await getPrisma().raffleDraw.count()).toBe(0);
  });

  it("UT-RA-02: draws an active ticket with the injected generator and leaves it pending", async () => {
    await createVisitorWithTickets("Neo");
    const trinity = await createVisitorWithTickets("Trinity");
    const tickets = await getPrisma().raffleTicket.findMany({ orderBy: { number: "asc" } });
    const randomInt = jest.fn((max: number) => max - 1);

    const result = await spin({ randomInt });

    expect(randomInt).toHaveBeenCalledWith(2);
    expect(result).toMatchObject({ status: "drawn", draw: { ticketNumber: tickets[1].number, gamertag: "Trinity" } });

    const draw = await getPrisma().raffleDraw.findFirstOrThrow({ include: { ticket: true } });

    expect(draw.outcome).toBe("pending");
    expect(draw.ticket.visitorId).toBe(trinity.id);
  });

  it("UT-RA-03: a second spin waits for the decision of the first (RF-51)", async () => {
    await createVisitorWithTickets("Neo");
    await createVisitorWithTickets("Trinity");
    await drawPending();

    const result = await spin();

    expect(result).toMatchObject({ status: "undecided", pending: { gamertag: "Neo" } });
    expect(await getPrisma().raffleDraw.count()).toBe(1);
  });

  it("RF-50: another administrator sees that somebody else is spinning", async () => {
    await createVisitorWithTickets("Neo");
    await createVisitorWithTickets("Trinity");
    await drawPending();

    const other = await createRaffleAdmin("Animador 2");
    const result = await spin({ actorId: other.id });

    expect(result).toMatchObject({ status: "busy", pending: { gamertag: "Neo", drawnById: adminId } });
  });

  it("RF-50: two administrators that spin at the same time get one draw and one busy answer", async () => {
    await createVisitorWithTickets("Neo");
    await createVisitorWithTickets("Trinity");
    const other = await createRaffleAdmin("Animador 2");

    const results = await Promise.all([spin(), spin({ actorId: other.id })]);

    expect(results.map((result) => result.status).sort()).toEqual(["busy", "drawn"]);
    expect(await getPrisma().raffleDraw.count()).toBe(1);
  });

  it("UT-RA-04: the same request id twice creates one draw and answers the same ticket", async () => {
    await createVisitorWithTickets("Neo");
    await createVisitorWithTickets("Trinity");
    const requestId = nextRequestId();

    const [once, twice] = await Promise.all([spin({ requestId }), spin({ requestId, randomInt: (max) => max - 1 })]);
    const again = await spin({ requestId });

    expect(once).toEqual(twice);
    expect(again).toEqual(once);
    expect(await getPrisma().raffleDraw.count()).toBe(1);
  });

  it("EC-08: a retried spin whose ticket another administrator already decided does not reopen it", async () => {
    await createVisitorWithTickets("Neo");
    await createVisitorWithTickets("Trinity");
    const requestId = nextRequestId();
    const first = await spin({ requestId });

    if (first.status !== "drawn") throw new Error("expected a draw");

    const other = await createRaffleAdmin("Otro");

    await decideDraw({ actorId: other.id, drawId: first.draw.id, outcome: "discarded", now: DURING_RAFFLE });

    expect(await spin({ requestId })).toEqual({ status: "alreadyDecided" });
    expect(await getPrisma().raffleDraw.count()).toBe(1);
  });

  it("UT-RA-05: a visitor with two tickets loses both when one comes out, in the same transaction", async () => {
    const neo = await createVisitorWithTickets("Neo", [9, 18]);
    await createVisitorWithTickets("Trinity");

    await drawPending();

    const tickets = await getPrisma().raffleTicket.findMany({ where: { visitorId: neo.id } });

    expect(tickets.map((ticket) => ticket.status)).toEqual(["drawn", "drawn"]);
    expect(await getPrisma().raffleTicket.count({ where: { status: "active" } })).toBe(1);
  });

  it("RN-05: the tickets of a visitor that already came out never come out again", async () => {
    await createVisitorWithTickets("Neo", [9, 18]);
    await createVisitorWithTickets("Trinity");

    const firstDraw = await drawPending();

    await decideDraw({ actorId: adminId, drawId: firstDraw, outcome: "discarded", now: DURING_RAFFLE });

    const second = await spin();

    expect(second).toMatchObject({ status: "drawn", draw: { gamertag: "Trinity" } });
  });

  it("UT-RA-10: refuses to spin once the raffle is closed", async () => {
    await createVisitorWithTickets("Neo");
    await getPrisma().eventSettings.update({ where: { id: 1 }, data: { raffleClosedAt: DURING_RAFFLE } });

    expect(await spin()).toEqual({ status: "closed" });
  });

  it("UT-RA-11: answers that no tickets are left without creating a draw", async () => {
    const voided = await createVisitorWithTickets("Neo");
    await getPrisma().raffleTicket.updateMany({ where: { visitorId: voided.id }, data: { status: "voided" } });

    expect(await spin()).toEqual({ status: "noTickets" });
    expect(await getPrisma().raffleDraw.count()).toBe(0);
  });

  it("refuses a broken generator instead of drawing with it", async () => {
    await createVisitorWithTickets("Neo");

    await expect(spin({ randomInt: () => 5 })).rejects.toThrow(RangeError);
    expect(await getPrisma().raffleDraw.count()).toBe(0);
    expect(await getPrisma().raffleTicket.count({ where: { status: "active" } })).toBe(1);
  });

  it("writes the draw to the audit log with the number of candidates", async () => {
    await createVisitorWithTickets("Neo");
    await createVisitorWithTickets("Trinity");

    const drawId = await drawPending();
    const entry = await getPrisma().auditLog.findFirstOrThrow({ where: { actorId: adminId, action: "raffle_drawn" } });

    expect(entry).toMatchObject({ entityType: "raffle_draw", entityId: drawId });
    expect(entry.detail).toMatchObject({ gamertag: "Neo", candidates: 2, index: 0 });
  });
});

describe("decideDraw", () => {
  it("UT-RA-06: a winner is final, gets an email with gamertag, ticket and hour, and is audited", async () => {
    await createVisitorWithTickets("Neo");
    const drawId = await drawPending();

    const result = await decideDraw({ actorId: adminId, drawId, outcome: "winner", now: DURING_RAFFLE });
    const draw = await getPrisma().raffleDraw.findUniqueOrThrow({ where: { id: drawId } });
    const email = await getPrisma().emailOutbox.findFirstOrThrow();

    expect(result).toEqual({ status: "decided", outcome: "winner", emailId: email.id });
    expect(draw).toMatchObject({ outcome: "winner", decidedAt: DURING_RAFFLE });
    expect(email.to).toBe("neo@example.com");
    expect(email.text).toContain("Neo");
    expect(email.text).toContain(`#${draw.ticketNumber}`);
    expect(email.text).toContain("18:05");
    expect(await getPrisma().auditLog.count({ where: { actorId: adminId, action: "raffle_winner_confirmed" } })).toBe(
      1,
    );
  });

  it("UT-RA-07: a discarded ticket sends nothing and frees the next spin", async () => {
    await createVisitorWithTickets("Neo");
    await createVisitorWithTickets("Trinity");
    const drawId = await drawPending();

    const result = await decideDraw({ actorId: adminId, drawId, outcome: "discarded", now: DURING_RAFFLE });

    expect(result).toEqual({ status: "decided", outcome: "discarded", emailId: null });
    expect(await getPrisma().emailOutbox.count()).toBe(0);
    expect((await spin()).status).toBe("drawn");
    expect(await getPrisma().auditLog.count({ where: { actorId: adminId, action: "raffle_ticket_discarded" } })).toBe(
      1,
    );
  });

  it("a decision is taken once: a second press is refused and sends no second email", async () => {
    await createVisitorWithTickets("Neo");
    const drawId = await drawPending();

    const answers = await Promise.all([
      decideDraw({ actorId: adminId, drawId, outcome: "winner", now: DURING_RAFFLE }),
      decideDraw({ actorId: adminId, drawId, outcome: "discarded", now: DURING_RAFFLE }),
    ]);

    expect(answers.map((answer) => answer.status).sort()).toEqual(["alreadyDecided", "decided"]);
    expect(await getPrisma().emailOutbox.count()).toBeLessThanOrEqual(1);
  });

  it("another raffle administrator can decide a ticket that was left waiting", async () => {
    await createVisitorWithTickets("Neo");
    const drawId = await drawPending();
    const other = await createRaffleAdmin("Animador 2");

    const result = await decideDraw({ actorId: other.id, drawId, outcome: "winner", now: DURING_RAFFLE });

    expect(result.status).toBe("decided");
  });

  it("answers notFound for a draw that does not exist", async () => {
    const result = await decideDraw({
      actorId: adminId,
      drawId: nextRequestId(),
      outcome: "winner",
      now: DURING_RAFFLE,
    });

    expect(result).toEqual({ status: "notFound" });
  });
});

describe("registerPrize", () => {
  it("UT-RA-09: another administrator registers the prize of a winner, with its name", async () => {
    await createVisitorWithTickets("Neo");
    const drawId = await drawPending();
    const other = await createRaffleAdmin("Animador 2");

    await decideDraw({ actorId: adminId, drawId, outcome: "winner", now: DURING_RAFFLE });

    expect(await registerPrize(other.id, { drawId, prizeName: "Audífonos" })).toEqual({ status: "registered" });

    const draw = await getPrisma().raffleDraw.findUniqueOrThrow({ where: { id: drawId } });

    expect(draw).toMatchObject({ prizeName: "Audífonos", prizeById: other.id });
    expect(await getPrisma().auditLog.count({ where: { actorId: other.id, action: "raffle_prize_registered" } })).toBe(
      1,
    );
  });

  it("UT-RA-08: a discarded ticket gets no prize", async () => {
    await createVisitorWithTickets("Neo");
    const drawId = await drawPending();

    await decideDraw({ actorId: adminId, drawId, outcome: "discarded", now: DURING_RAFFLE });

    expect(await registerPrize(adminId, { drawId, prizeName: "Audífonos" })).toEqual({ status: "notWinner" });
  });

  it("the prize is written once", async () => {
    await createVisitorWithTickets("Neo");
    const drawId = await drawPending();

    await decideDraw({ actorId: adminId, drawId, outcome: "winner", now: DURING_RAFFLE });
    await registerPrize(adminId, { drawId, prizeName: "Audífonos" });

    expect(await registerPrize(adminId, { drawId, prizeName: "Teclado" })).toEqual({ status: "alreadyRegistered" });
    expect(await registerPrize(adminId, { drawId: nextRequestId(), prizeName: "Teclado" })).toEqual({
      status: "notFound",
    });
  });
});

describe("closeRaffle", () => {
  it("RF-54: closes the raffle and audits it; nobody spins after it", async () => {
    await createVisitorWithTickets("Neo");

    expect(await closeRaffle(adminId, DURING_RAFFLE)).toEqual({ status: "closed" });
    expect(await closeRaffle(adminId, DURING_RAFFLE)).toEqual({ status: "alreadyClosed" });
    expect(await spin()).toEqual({ status: "closed" });
    expect(await getPrisma().auditLog.count({ where: { actorId: adminId, action: "raffle_closed" } })).toBe(1);
  });

  it("does not close before the start or with a ticket waiting for a decision", async () => {
    await createVisitorWithTickets("Neo");

    expect(await closeRaffle(adminId, new Date(RAFFLE_STARTS_AT.getTime() - 1))).toEqual({
      status: "notStarted",
      startsAt: RAFFLE_STARTS_AT,
    });

    await drawPending();

    expect(await closeRaffle(adminId, DURING_RAFFLE)).toEqual({ status: "pendingDraw" });
  });
});

async function drawPending(): Promise<string> {
  const result = await spin();

  if (result.status !== "drawn") throw new Error(`Se esperaba un giro, llegó ${result.status}`);

  return result.draw.id;
}

function spin(overrides: Partial<Parameters<typeof spinRaffle>[0]> = {}) {
  return spinRaffle({
    actorId: adminId,
    requestId: nextRequestId(),
    now: DURING_RAFFLE,
    randomInt: first,
    ...overrides,
  });
}

function first(): number {
  return 0;
}
