/**
 * @jest-environment node
 */
import { GET } from "@features/tournament/api/entries-route";
import { createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const accountIds: Record<string, string> = {};

beforeAll(async () => {
  const [first, second] = await createVisitors(2);

  await getPrisma().tournamentEntry.create({ data: { visitorId: first.id, channel: "pre", status: "registered" } });
  await getPrisma().tournamentEntry.create({
    data: { visitorId: second.id, channel: "onsite", status: "checked_in", checkedInAt: new Date() },
  });
  await createAccount("admin", "kof_admin");
  await createAccount("desk1", "kof_staff", 1);
  await createAccount("sysadmin", "sysadmin");
  await createAccount("helpdesk", "help_desk");
  await createAccount("stand", "raffle_admin");
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
});

// S26: the sysadmin and the KOF administrator see who is in the tournament; nobody else does.
describe("GET /api/tournament/entries", () => {
  it("answers 401 without a session", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

  it.each(["helpdesk", "stand"])("answers 401 to %s, who is not from KOF", async (key) => {
    await signInAs(key);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

  it("answers 403 to the staff of a desk, who captures matches but does not see the list", async () => {
    await signInAs("desk1");

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each(["admin", "sysadmin"])("sends the participants to %s and never lets them be cached", async (key) => {
    await signInAs(key);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.entries.map((entry: { gamertag: string; status: string }) => [entry.gamertag, entry.status])).toEqual([
      ["Jugador1", "registered"],
      ["Jugador2", "checked_in"],
    ]);
  });
});

async function createAccount(key: string, role: string, kofDesk?: number) {
  const account = await getPrisma().account.create({
    data: { email: `${key}@ut.mx`, name: key, role, status: "active", password: "scrypt$1$1$1$a$b", kofDesk },
  });

  accountIds[key] = account.id;
}

async function signInAs(key: string) {
  stubCookies(createCookieJar());
  await createSession(accountIds[key]);
}
