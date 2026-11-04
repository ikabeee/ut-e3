/**
 * @jest-environment node
 */
import { GET as getLive } from "@features/raffle/api/raffle-live-route";
import { GET as getAdmin } from "@features/raffle/api/raffle-route";
import { createEventSettings, createRaffleAdmin } from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(createEventSettings);

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(() => {
  stubCookies(createCookieJar());
});

describe("raffle Route Handlers", () => {
  it("GET /api/raffle/live answers the public raffle without a session and never cached", async () => {
    const response = await getLive();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ latest: null, winners: [], revision: 0 });
  });

  it("GET /api/raffle answers 401 without a raffle administrator", async () => {
    const response = await getAdmin();

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("GET /api/raffle answers the panel to a raffle administrator", async () => {
    await createSession((await createRaffleAdmin()).id);

    const response = await getAdmin();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ activeTickets: 0, pending: null, discardedCount: 0 });
  });
});
