/**
 * @jest-environment node
 */
import { signIn, signOut } from "@features/accounts/lib/accounts-actions";
import { seedSysadmin } from "@features/accounts/lib/server/sysadmin-seed";
import { SESSION_COOKIE } from "@shared/lib/session-cookie";
import { createSession } from "@shared/lib/server/session";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter, stubHeaders } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { liftSysadminGuard } from "@shared/__tests__/lib/server/sysadmin-guard";

const PASSWORD = "correct horse battery staple";

const INVALID_CREDENTIALS = { error: "Correo o contraseña incorrectos" };

let jar = createCookieJar();

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let accountId = "";

let afterStub = stubAfter();

beforeAll(async () => {
  await seedSysadmin(getPrisma(), {
    SYSADMIN_EMAIL: "admin@ut.mx",
    SYSADMIN_NAME: "Coordinación E3",
    SYSADMIN_PASSWORD: PASSWORD,
  });
  accountId = (await getPrisma().account.findFirstOrThrow({ where: { email: "admin@ut.mx" } })).id;
});

afterAll(async () => {
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  stubHeaders({ "x-forwarded-for": "203.0.113.10" });
  afterStub.restore();
  afterStub = stubAfter();
  await getPrisma().session.deleteMany();
  await getPrisma().loginChallenge.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().account.updateMany({ data: { status: "active" } });
});

describe("signIn", () => {
  it("answers the missing fields error to a body that is not FormData, instead of a 500", async () => {
    // curl -H "Next-Action: <id>" -H "content-type: text/plain" -d "[1,2,3]" decodes the arguments as (1, 2).
    await expect(signIn(null, 2)).resolves.toEqual({
      error: "Escribe tu correo y tu contraseña.",
    });
  });

  it("opens no session for the right email and password: it goes to /login/verify for the emailed code", async () => {
    await expect(signIn(null, credentials(" Admin@UT.mx ", PASSWORD))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login/verify;"),
    });

    expect(await getPrisma().session.count()).toBe(0);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it.each([
    ["a wrong password", credentials("admin@ut.mx", "correct horse battery stapler")],
    ["an unknown email", credentials("nadie@ut.mx", PASSWORD)],
  ])("answers the same generic message for %s and opens no session", async (_case, form) => {
    expect(await signIn(null, form)).toEqual(INVALID_CREDENTIALS);
    expect(await getPrisma().session.count()).toBe(0);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("rejects a disabled account with the same generic message", async () => {
    await liftSysadminGuard(getPrisma());
    await getPrisma().account.updateMany({ data: { status: "disabled" } });

    expect(await signIn(null, credentials("admin@ut.mx", PASSWORD))).toEqual(INVALID_CREDENTIALS);
    expect(await getPrisma().session.count()).toBe(0);
  });

  it("asks for both fields when one is empty", async () => {
    expect(await signIn(null, credentials("admin@ut.mx", ""))).toEqual({
      error: "Escribe tu correo y tu contraseña.",
    });
  });

  it("signs in with the right password after more than three failures in an hour: there is no limit", async () => {
    for (const attempt of [1, 2, 3, 4, 5]) {
      expect(await signIn(null, credentials("admin@ut.mx", `wrong-${attempt}`))).toEqual(INVALID_CREDENTIALS);
    }

    await expect(signIn(null, credentials("ADMIN@ut.mx", PASSWORD))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login/verify;"),
    });
  });

  it("answers every wrong password of a concurrent burst the same way", async () => {
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((attempt) => signIn(null, credentials("admin@ut.mx", `wrong-${attempt}`))),
    );

    expect(results.filter((result) => result.error === INVALID_CREDENTIALS.error)).toHaveLength(5);
  });
});

describe("signOut", () => {
  it("closes the session, expires the cookie and goes to /login", async () => {
    await createSession(accountId);

    await expect(signOut()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });

    expect(await getPrisma().session.count()).toBe(0);
    expect(jar.get(SESSION_COOKIE)).toMatchObject({ value: "", expires: new Date(0) });
  });
});

function credentials(email: string, password: string) {
  const form = new FormData();

  form.set("email", email);
  form.set("password", password);

  return form;
}
