/**
 * @jest-environment node
 */
import { requireSysadmin } from "@features/accounts/lib/server/current-account";
import { createSession } from "@shared/lib/server/session";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().account.deleteMany();
});

describe("requireSysadmin", () => {
  it("returns the signed-in sysadmin", async () => {
    const account = await createAccount("sysadmin");

    await createSession(account.id);

    expect(await requireSysadmin()).toEqual({
      id: account.id,
      email: "cuenta@ut.mx",
      name: "Cuenta",
      role: "sysadmin",
    });
  });

  it("sends a visitor without a session to /login", async () => {
    await expect(requireSysadmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("sends a signed-in account with another role to /login", async () => {
    const account = await createAccount("help_desk");

    await createSession(account.id);

    await expect(requireSysadmin()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

function createAccount(role: string) {
  return getPrisma().account.create({
    data: { email: "cuenta@ut.mx", name: "Cuenta", role, status: "active", password: "scrypt$1$1$1$a$b" },
  });
}
