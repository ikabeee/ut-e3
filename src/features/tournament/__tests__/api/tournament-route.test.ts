/**
 * @jest-environment node
 */
import { GET } from "@features/tournament/api/tournament-route";
import { generateTournament } from "@features/tournament/lib/server/tournament-mutations";
import { createPlayers } from "@features/tournament/__tests__/tournament-test-utils";
import { createEventSettings, GENERATES_AT } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const accountIds: Record<string, string> = {};

beforeAll(async () => {
  await createEventSettings();
  await createAccount("admin", "kof_admin");
  await createAccount("desk1", "kof_staff", 1);
  await createAccount("sysadmin", "sysadmin");
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().kofTournament.deleteMany();
});

describe("GET /api/tournament", () => {
  it("answers 401 without a session", async () => {
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("answers 401 to an account that is not from KOF", async () => {
    await signInAs("sysadmin");

    expect((await GET()).status).toBe(401);
  });

  it("answers null before the bracket is generated", async () => {
    await signInAs("admin");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tournament).toBeNull();
    expect(body.serverNow).toEqual(expect.any(Number));
  });

  it.each(["admin", "desk1"])("sends the bracket to %s and never lets it be cached", async (key) => {
    await generateTournament(accountIds.admin, createPlayers(64), GENERATES_AT);
    await signInAs(key);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.tournament.matches).toHaveLength(63);
    expect(body.tournament.version).toBe(0);
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
