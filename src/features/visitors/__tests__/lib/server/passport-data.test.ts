/**
 * @jest-environment node
 */
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
  await getPrisma().visitorDevice.deleteMany();
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

async function createStand(number: number) {
  return getPrisma().stand.create({
    data: { zone: "A", number, studio: 1, groupCode: "101" },
  });
}

describe("checkins", () => {
  it("stores one check-in per visitor and stand (RF-23)", async () => {
    const visitor = await createVisitor("neo");
    const stand = await createStand(1);

    await getPrisma().checkIn.create({ data: { visitorId: visitor.id, standId: stand.id } });

    await expect(getPrisma().checkIn.create({ data: { visitorId: visitor.id, standId: stand.id } })).rejects.toThrow(
      /Unique constraint/,
    );
  });

  it("accepts check-ins of one visitor at different stands", async () => {
    const visitor = await createVisitor("trinity");
    const first = await createStand(1);
    const second = await createStand(2);

    await getPrisma().checkIn.createMany({
      data: [
        { visitorId: visitor.id, standId: first.id },
        { visitorId: visitor.id, standId: second.id },
      ],
    });

    await expect(getPrisma().checkIn.count({ where: { visitorId: visitor.id } })).resolves.toBe(2);
  });
});

describe("raffle_tickets", () => {
  it("grants at most one ticket per visitor and milestone (RF-22)", async () => {
    const visitor = await createVisitor("morpheus");

    await getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone: 9 } });

    await expect(getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone: 9 } })).rejects.toThrow(
      /Unique constraint/,
    );
  });

  it("only accepts the milestones 9 and 18 (RN-01)", async () => {
    const visitor = await createVisitor("oracle");

    await expect(getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone: 10 } })).rejects.toThrow(
      /CHECK constraint/,
    );
  });

  it("starts every ticket as active", async () => {
    const visitor = await createVisitor("niobe");

    const ticket = await getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone: 18 } });

    expect(ticket.status).toBe("active");
  });

  it("only accepts the statuses active and voided", async () => {
    const visitor = await createVisitor("link");

    await expect(
      getPrisma().raffleTicket.create({ data: { visitorId: visitor.id, milestone: 9, status: "won" } }),
    ).rejects.toThrow(/CHECK constraint/);
  });

  it("numbers tickets globally and in increasing order (RF-22)", async () => {
    const first = await createVisitor("switch");
    const second = await createVisitor("apoc");

    const firstTicket = await getPrisma().raffleTicket.create({ data: { visitorId: first.id, milestone: 9 } });
    const secondTicket = await getPrisma().raffleTicket.create({ data: { visitorId: second.id, milestone: 9 } });

    expect(secondTicket.number).toBeGreaterThan(firstTicket.number);
  });
});
