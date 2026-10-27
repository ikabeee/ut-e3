/**
 * @jest-environment node
 */
import { clearAttempts, consumeAttempt } from "@shared/lib/server/rate-limit";
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

describe("consumeAttempt", () => {
  it("allows three attempts in a window and refuses the fourth", async () => {
    const results = [];

    for (const now of [TEN_AM, TEN_AM, TEN_FIFTY_NINE, TEN_FIFTY_NINE]) {
      results.push(await consumeAttempt("login:admin@ut.mx", LIMIT, now));
    }

    expect(results).toEqual([true, true, true, false]);
  });

  it("allows only three of a concurrent burst, because each attempt is counted before it is answered", async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () => consumeAttempt("login:admin@ut.mx", LIMIT, TEN_AM)),
    );

    expect(results.filter(Boolean)).toHaveLength(3);
  });

  it("counts each key on its own", async () => {
    await Promise.all([1, 2, 3].map(() => consumeAttempt("login:admin@ut.mx", LIMIT, TEN_AM)));

    expect(await consumeAttempt("login:otro@ut.mx", LIMIT, TEN_AM)).toBe(true);
  });

  it("starts a new count when the next window begins", async () => {
    await Promise.all([1, 2, 3, 4].map(() => consumeAttempt("login:admin@ut.mx", LIMIT, TEN_AM)));

    expect(await consumeAttempt("login:admin@ut.mx", LIMIT, ELEVEN_AM)).toBe(true);
  });

  it("keeps one row per key and window with the running count", async () => {
    await Promise.all([1, 2, 3].map(() => consumeAttempt("login:admin@ut.mx", LIMIT, TEN_AM)));

    expect(await getPrisma().rateLimit.findMany()).toEqual([
      { key: "login:admin@ut.mx", windowStart: TEN_AM, count: 3 },
    ]);
  });
});

describe("clearAttempts", () => {
  it("forgets every window of a key and leaves other keys alone", async () => {
    await consumeAttempt("login:admin@ut.mx", LIMIT, TEN_AM);
    await consumeAttempt("login:admin@ut.mx", LIMIT, ELEVEN_AM);
    await consumeAttempt("login:otro@ut.mx", LIMIT, TEN_AM);

    await clearAttempts("login:admin@ut.mx");

    expect(await getPrisma().rateLimit.findMany({ select: { key: true } })).toEqual([{ key: "login:otro@ut.mx" }]);
  });
});
