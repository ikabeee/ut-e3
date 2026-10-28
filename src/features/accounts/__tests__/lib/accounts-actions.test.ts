/**
 * @jest-environment node
 */
import { signIn, signOut } from "@features/accounts/lib/accounts-actions";
import { seedSysadmin } from "@features/accounts/lib/server/sysadmin-seed";
import { SESSION_COOKIE } from "@shared/lib/session-cookie";
import { hashPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const PASSWORD = "correct horse battery staple";

const INVALID_CREDENTIALS = { error: "Correo o contraseña incorrectos" };

let jar = createCookieJar();

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(async () => {
  await seedSysadmin(getPrisma(), {
    SYSADMIN_EMAIL: "admin@ut.mx",
    SYSADMIN_NAME: "Coordinación E3",
    SYSADMIN_PASSWORD: PASSWORD,
  });
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  await getPrisma().session.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().account.updateMany({ data: { status: "active" } });
});

describe("signIn", () => {
  it("opens a session for the right email and password and goes to /admin", async () => {
    await expect(signIn(null, credentials(" Admin@UT.mx ", PASSWORD))).rejects.toMatchObject({
      digest: expect.stringContaining(";/admin;"),
    });

    expect(await getPrisma().session.count()).toBe(1);
    expect(jar.get(SESSION_COOKIE)?.value).toBeTruthy();
  });

  it.each([
    ["kof_admin", null],
    ["kof_staff", 1],
  ] as const)("sends a %s to the KOF page instead of /admin", async (role, kofDesk) => {
    await getPrisma().account.create({
      data: {
        email: "kof@ut.mx",
        name: "KOF",
        role,
        status: "active",
        password: await hashPassword(PASSWORD),
        kofDesk,
      },
    });

    await expect(signIn(null, credentials("kof@ut.mx", PASSWORD))).rejects.toMatchObject({
      digest: expect.stringContaining(";/admin/kof;"),
    });

    await getPrisma().session.deleteMany();
    await getPrisma().account.deleteMany({ where: { email: "kof@ut.mx" } });
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
    await getPrisma().account.updateMany({ data: { status: "disabled" } });

    expect(await signIn(null, credentials("admin@ut.mx", PASSWORD))).toEqual(INVALID_CREDENTIALS);
    expect(await getPrisma().session.count()).toBe(0);
  });

  it("asks for both fields when one is empty", async () => {
    expect(await signIn(null, credentials("admin@ut.mx", ""))).toEqual({
      error: "Escribe tu correo y tu contraseña.",
    });
  });

  it("blocks the fourth attempt after three failures in an hour, even with the right password", async () => {
    for (const attempt of [1, 2, 3]) {
      expect(await signIn(null, credentials("admin@ut.mx", `wrong-${attempt}`))).toEqual(INVALID_CREDENTIALS);
    }

    expect(await signIn(null, credentials("ADMIN@ut.mx", PASSWORD))).toEqual({
      error: "Demasiados intentos. Intenta de nuevo más tarde.",
    });
    expect(await getPrisma().session.count()).toBe(0);
  });

  it("answers at most three of a concurrent burst of wrong passwords and blocks the rest", async () => {
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((attempt) => signIn(null, credentials("admin@ut.mx", `wrong-${attempt}`))),
    );

    expect(results.filter((result) => result.error === INVALID_CREDENTIALS.error)).toHaveLength(3);
    expect(
      results.filter((result) => result.error === "Demasiados intentos. Intenta de nuevo más tarde."),
    ).toHaveLength(2);
  });

  it("forgets the failed attempts after a successful sign-in", async () => {
    await signIn(null, credentials("admin@ut.mx", "wrong-1"));
    await signIn(null, credentials("admin@ut.mx", "wrong-2"));
    await signIn(null, credentials("admin@ut.mx", PASSWORD)).catch(() => undefined);

    expect(await getPrisma().rateLimit.count()).toBe(0);
  });
});

describe("signOut", () => {
  it("closes the session, expires the cookie and goes to /login", async () => {
    await signIn(null, credentials("admin@ut.mx", PASSWORD)).catch(() => undefined);

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
