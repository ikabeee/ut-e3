/**
 * @jest-environment node
 */
import { getPassportVisits } from "@features/visitors/lib/server/passport-visits-queries";
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

async function createVisitor(gamertag: string) {
  return getPrisma().visitor.create({
    data: {
      fullName: `Visitante ${gamertag}`,
      gamertag,
      email: `${gamertag}@example.com`,
      pin: `encrypted-${gamertag}`,
      pinLookup: `lookup-${gamertag}`,
    },
  });
}

async function createStand(zone: string, number: number) {
  return getPrisma().stand.create({ data: { zone, number, studio: 1, groupCode: "101" } });
}

describe("getPassportVisits", () => {
  it("lists every stand in zone and number order with its short code and whether it was visited (RF-20, RF-11)", async () => {
    const visitor = await createVisitor("neo");

    await createStand("A", 2);

    await createStand("A", 1);

    const block = await createStand("B", 1);

    await getPrisma().checkIn.create({ data: { visitorId: visitor.id, standId: block.id } });

    const result = await getPassportVisits(visitor.id);

    expect(result.stands).toEqual([
      { code: "ZA-S1", visited: false },
      { code: "ZA-S2", visited: false },
      { code: "ZB-S1", visited: true },
    ]);
  });

  it("counts only the visits of this visitor", async () => {
    const visitor = await createVisitor("neo");
    const other = await createVisitor("trinity");

    const stand = await createStand("A", 1);

    await getPrisma().checkIn.create({ data: { visitorId: other.id, standId: stand.id } });

    const result = await getPassportVisits(visitor.id);

    expect(result.visitCount).toBe(0);
    expect(result.stands).toEqual([{ code: "ZA-S1", visited: false }]);
  });

  it("returns the tickets of the visitor with their global numbers, in order (RF-22)", async () => {
    const visitor = await createVisitor("neo");
    const other = await createVisitor("trinity");

    await getPrisma().raffleTicket.create({ data: { visitorId: other.id, milestone: 9 } });
    await getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone: 9 } });
    await getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone: 18 } });

    const result = await getPassportVisits(visitor.id);

    expect(result.tickets.map((ticket) => ticket.milestone)).toEqual([9, 18]);
    expect(result.tickets[0].number).toBeLessThan(result.tickets[1].number);
  });

  it("returns no visits and no tickets for a new visitor", async () => {
    const visitor = await createVisitor("neo");

    const result = await getPassportVisits(visitor.id);

    expect(result).toEqual({ visitCount: 0, stands: [], tickets: [] });
  });
});
