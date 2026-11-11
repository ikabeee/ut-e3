/**
 * @jest-environment node
 */
import { grantMilestoneTickets } from "@features/visitors/lib/server/milestone-tickets";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().raffleTicket.deleteMany();
  await getPrisma().checkIn.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().stand.deleteMany();
});

async function createVisitor() {
  return getPrisma().visitor.create({
    data: {
      fullName: "Morfeo Demo",
      gamertag: "morfeo",
      email: "morfeo@example.com",
      pin: "encrypted",
      pinLookup: "lookup",
    },
  });
}

async function createStands(count: number) {
  const stands = [];

  for (let number = 1; number <= count; number += 1) {
    stands.push(await getPrisma().stand.create({ data: { zone: "A", number, studio: 1, groupCode: "101" } }));
  }

  return stands;
}

// Records the check-ins and grants the tickets in one transaction, as the kiosk will (M5).
async function checkInAndGrant(visitorId: string, standIds: string[]) {
  return getPrisma().$transaction(async (transaction) => {
    for (const standId of standIds) {
      await transaction.checkIn.create({ data: { visitorId, standId } });
    }

    return grantMilestoneTickets(transaction, visitorId);
  });
}

async function ticketMilestones(visitorId: string) {
  const tickets = await getPrisma().raffleTicket.findMany({
    where: { visitorId },
    orderBy: { number: "asc" },
    select: { milestone: true },
  });

  return tickets.map((ticket) => ticket.milestone);
}

describe("grantMilestoneTickets", () => {
  it("grants nothing below the first milestone", async () => {
    const visitor = await createVisitor();
    const stands = await createStands(8);

    const granted = await checkInAndGrant(
      visitor.id,
      stands.map((stand) => stand.id),
    );

    expect(granted).toBe(0);
    await expect(ticketMilestones(visitor.id)).resolves.toEqual([]);
  });

  it("grants the ticket of milestone 9 with the ninth visit (UT-CI-16)", async () => {
    const visitor = await createVisitor();
    const stands = await createStands(9);
    await checkInAndGrant(
      visitor.id,
      stands.slice(0, 8).map((stand) => stand.id),
    );

    const granted = await checkInAndGrant(visitor.id, [stands[8].id]);

    expect(granted).toBe(1);
    await expect(ticketMilestones(visitor.id)).resolves.toEqual([9]);
  });

  it("grants the ticket of milestone 18 with the eighteenth visit (UT-CI-17)", async () => {
    const visitor = await createVisitor();
    const stands = await createStands(18);
    await checkInAndGrant(
      visitor.id,
      stands.slice(0, 17).map((stand) => stand.id),
    );

    const granted = await checkInAndGrant(visitor.id, [stands[17].id]);

    expect(granted).toBe(1);
    await expect(ticketMilestones(visitor.id)).resolves.toEqual([9, 18]);
  });

  it("does not grant the same milestone twice (UT-CI-18)", async () => {
    const visitor = await createVisitor();
    const stands = await createStands(10);
    await checkInAndGrant(
      visitor.id,
      stands.slice(0, 9).map((stand) => stand.id),
    );

    const granted = await checkInAndGrant(visitor.id, [stands[9].id]);

    expect(granted).toBe(0);
    await expect(ticketMilestones(visitor.id)).resolves.toEqual([9]);
  });

  it("grants both milestones when a visitor reaches 18 without earlier tickets", async () => {
    const visitor = await createVisitor();
    const stands = await createStands(18);

    const granted = await checkInAndGrant(
      visitor.id,
      stands.map((stand) => stand.id),
    );

    expect(granted).toBe(2);
    await expect(ticketMilestones(visitor.id)).resolves.toEqual([9, 18]);
  });

  it("numbers the tickets globally in increasing order (RF-22)", async () => {
    const first = await createVisitor();

    const second = await getPrisma().visitor.create({
      data: { fullName: "Trinity Demo", gamertag: "trinity", email: "trinity@example.com", pin: "e2", pinLookup: "l2" },
    });

    const stands = await createStands(9);

    await checkInAndGrant(
      first.id,
      stands.map((stand) => stand.id),
    );

    await checkInAndGrant(
      second.id,
      stands.map((stand) => stand.id),
    );

    const numbers = (
      await getPrisma().raffleTicket.findMany({ orderBy: { number: "asc" }, select: { number: true } })
    ).map((ticket) => ticket.number);

    expect(numbers).toHaveLength(2);
    expect(numbers[1]).toBeGreaterThan(numbers[0]);
  });
});
