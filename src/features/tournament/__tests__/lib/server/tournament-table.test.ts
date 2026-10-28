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
  await getPrisma().kofTournament.deleteMany();
});

describe("kof_tournament table", () => {
  it("stores the state as JSON next to its version", async () => {
    await getPrisma().kofTournament.create({ data: { id: 1, state: { phase: "running", matches: [] }, version: 0 } });

    const row = await getPrisma().kofTournament.findUniqueOrThrow({ where: { id: 1 } });

    expect(row.state).toEqual({ phase: "running", matches: [] });
    expect(row.version).toBe(0);
  });

  it("keeps a single row: any other id is rejected", async () => {
    await expect(getPrisma().kofTournament.create({ data: { id: 2, state: {}, version: 0 } })).rejects.toThrow();
    expect(await getPrisma().kofTournament.count()).toBe(0);
  });

  it("rejects a second row with the same id", async () => {
    await getPrisma().kofTournament.create({ data: { id: 1, state: {}, version: 0 } });

    await expect(getPrisma().kofTournament.create({ data: { id: 1, state: {}, version: 0 } })).rejects.toThrow();
  });

  it("rejects a negative version", async () => {
    await expect(getPrisma().kofTournament.create({ data: { id: 1, state: {}, version: -1 } })).rejects.toThrow();
    expect(await getPrisma().kofTournament.count()).toBe(0);
  });
});
