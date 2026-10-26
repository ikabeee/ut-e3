/**
 * @jest-environment node
 */
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const STARTS_AT = new Date("2026-11-20T17:55:00.000Z");

const ONE_MINUTE_EARLIER = new Date("2026-11-20T17:54:00.000Z");

const database = createTestDatabase();

const prisma = createTestClient(database);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  await prisma.scheduleItem.deleteMany();
});

describe("schedule_items table", () => {
  it("accepts an instant activity that ends when it starts", async () => {
    await createScheduleItem(STARTS_AT);

    expect(await prisma.scheduleItem.count()).toBe(1);
  });

  it("rejects an activity that ends before it starts and keeps the schedule unchanged", async () => {
    await createScheduleItem(STARTS_AT);

    await expect(createScheduleItem(ONE_MINUTE_EARLIER)).rejects.toThrow();
    expect(await prisma.scheduleItem.count()).toBe(1);
  });
});

function createScheduleItem(endsAt: Date) {
  return prisma.scheduleItem.create({
    data: {
      title: "Publicación del bracket de KOF",
      description: "El bracket aparece en la pantalla del escenario.",
      startsAt: STARTS_AT,
      endsAt,
    },
  });
}
