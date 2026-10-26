/**
 * @jest-environment node
 */
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

const prisma = createTestClient(database);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  await prisma.sponsor.deleteMany();
});

describe("sponsors table", () => {
  it("accepts a phone in E.164 format", async () => {
    await createSponsor("+529981234567");

    expect(await prisma.sponsor.count()).toBe(1);
  });

  it("rejects a phone without the leading + and keeps the sponsors unchanged", async () => {
    await createSponsor("+529981234567");

    await expect(createSponsor("9981234567")).rejects.toThrow();
    expect(await prisma.sponsor.count()).toBe(1);
  });
});

function createSponsor(phone: string) {
  return prisma.sponsor.create({
    data: {
      name: "Estudio Caribe",
      logoPath: "/sponsors/estudio-caribe.svg",
      websiteUrl: "https://example.com",
      phone,
      services: "Desarrollo de videojuegos",
      position: 1,
    },
  });
}
