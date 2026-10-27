/**
 * @jest-environment node
 */
import { isRateLimited, recordAttempt } from "@shared/lib/server/rate-limit";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

const TEN_AM = new Date("2026-11-20T15:00:00.000Z");

const TEN_FIFTY_NINE = new Date("2026-11-20T15:59:00.000Z");

const ELEVEN_AM = new Date("2026-11-20T16:00:00.000Z");

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().rateLimit.deleteMany();
});

describe("isRateLimited and recordAttempt", () => {
  it("limits a key after three attempts in the same window", async () => {
    await recordAttempt("login:admin@ut.mx", LIMIT, TEN_AM);
    await recordAttempt("login:admin@ut.mx", LIMIT, TEN_AM);

    expect(await isRateLimited("login:admin@ut.mx", LIMIT, TEN_FIFTY_NINE)).toBe(false);

    await recordAttempt("login:admin@ut.mx", LIMIT, TEN_FIFTY_NINE);

    expect(await isRateLimited("login:admin@ut.mx", LIMIT, TEN_FIFTY_NINE)).toBe(true);
  });

  it("counts each key on its own", async () => {
    await Promise.all([1, 2, 3].map(() => recordAttempt("login:admin@ut.mx", LIMIT, TEN_AM)));

    expect(await isRateLimited("login:otro@ut.mx", LIMIT, TEN_AM)).toBe(false);
  });

  it("starts a new count when the next window begins", async () => {
    await Promise.all([1, 2, 3].map(() => recordAttempt("login:admin@ut.mx", LIMIT, TEN_AM)));

    expect(await isRateLimited("login:admin@ut.mx", LIMIT, ELEVEN_AM)).toBe(false);
  });

  it("keeps one row per key and window with the running count", async () => {
    await Promise.all([1, 2, 3].map(() => recordAttempt("login:admin@ut.mx", LIMIT, TEN_AM)));

    expect(await getPrisma().rateLimit.findMany()).toEqual([
      { key: "login:admin@ut.mx", windowStart: TEN_AM, count: 3 },
    ]);
  });
});
