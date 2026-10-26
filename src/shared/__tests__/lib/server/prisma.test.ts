/**
 * @jest-environment node
 */
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

beforeAll(() => {
  process.env.DATABASE_URL = database.url;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("getPrisma", () => {
  it("returns the same client on every call", () => {
    expect(getPrisma()).toBe(getPrisma());
  });

  it("opens the database in WAL mode", async () => {
    const [pragma] = await getPrisma().$queryRaw<{ journal_mode: string }[]>`PRAGMA journal_mode`;

    expect(pragma.journal_mode).toBe("wal");
  });

  it("sets busy_timeout to 5000 ms", async () => {
    const [pragma] = await getPrisma().$queryRaw<{ timeout: number | bigint }[]>`PRAGMA busy_timeout`;

    expect(Number(pragma.timeout)).toBe(5000);
  });

  it("stores a date as ISO 8601 UTC text", async () => {
    const item = await getPrisma().scheduleItem.create({
      data: {
        title: "Inauguración",
        description: "En el escenario principal.",
        startsAt: new Date("2026-11-20T17:00:00.000Z"),
        endsAt: new Date("2026-11-20T17:30:00.000Z"),
      },
    });

    const [stored] = await getPrisma().$queryRaw<{ storageClass: string; text: string }[]>`
      SELECT typeof(starts_at) AS storageClass, CAST(starts_at AS TEXT) AS text
      FROM schedule_items WHERE id = ${item.id}`;

    expect(stored.storageClass).toBe("text");
    expect(stored.text).toMatch(/^2026-11-20T17:00:00\.000(Z|\+00:00)$/);
  });
});
