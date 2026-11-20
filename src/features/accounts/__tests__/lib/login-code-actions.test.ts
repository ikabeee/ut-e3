/**
 * @jest-environment node
 */
import { signIn } from "@features/accounts/lib/accounts-actions";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { resendLoginCodeAction, verifyLoginCodeAction } from "@features/accounts/lib/login-code-actions";
import { MAX_CODE_ATTEMPTS } from "@features/accounts/lib/server/login-challenge";
import { seedSysadmin } from "@features/accounts/lib/server/sysadmin-seed";
import { SESSION_COOKIE } from "@shared/lib/session-cookie";
import { hashPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter, stubHeaders } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const PASSWORD = "correct horse battery staple";

const ERRORS = ACCOUNTS_COPY.verifyCode.errors;

const CHALLENGE_COOKIE = "ut_login_challenge";

let jar = createCookieJar();

let afterStub = stubAfter();

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeAll(async () => {
  await seedSysadmin(getPrisma(), {
    SYSADMIN_EMAIL: "admin@ut.mx",
    SYSADMIN_NAME: "Coordinación E3",
    SYSADMIN_PASSWORD: PASSWORD,
  });
  await recordVerifiedLogin("admin@ut.mx");
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
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();
});

describe("the password step of signIn", () => {
  it("opens no session: it sets the challenge cookie, queues the code email and goes to /login/verify", async () => {
    await expect(signIn(null, credentials("admin@ut.mx", PASSWORD))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login/verify;"),
    });

    expect(await getPrisma().session.count()).toBe(0);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(jar.get(CHALLENGE_COOKIE)?.value).toBeTruthy();
    expect(await getPrisma().emailOutbox.findMany({ select: { to: true } })).toEqual([{ to: "admin@ut.mx" }]);
    expect(afterStub.callbacks).toHaveLength(1);
  });

  it("sends no code and sets no cookie for a wrong password", async () => {
    expect(await signIn(null, credentials("admin@ut.mx", "wrong password here"))).toEqual({
      error: "Correo o contraseña incorrectos",
    });
    expect(await getPrisma().emailOutbox.count()).toBe(0);
    expect(jar.has(CHALLENGE_COOKIE)).toBe(false);
  });
});

describe("verifyLoginCodeAction", () => {
  it("creates the session, clears the challenge cookie and goes to the home of the role with the right code", async () => {
    const code = await signInAndReadCode();

    await expect(verifyLoginCodeAction(null, codeForm(code))).rejects.toMatchObject({
      digest: expect.stringContaining(";/admin;"),
    });

    expect(await getPrisma().session.count()).toBe(1);
    expect(jar.get(SESSION_COOKIE)?.value).toBeTruthy();
    expect(jar.get(CHALLENGE_COOKIE)).toMatchObject({ value: "", expires: new Date(0) });
  });

  it("sends the first verified login of an account to /my-role instead of its home (S4)", async () => {
    await createStaffAccount("kof_staff", "first@ut.mx", 2);
    await signIn(null, credentials("first@ut.mx", PASSWORD)).catch(() => undefined);

    await expect(verifyLoginCodeAction(null, codeForm(await readCodeFor("first@ut.mx")))).rejects.toMatchObject({
      digest: expect.stringContaining(";/my-role;"),
    });

    expect(await getPrisma().session.count()).toBe(1);
    expect(jar.get(SESSION_COOKIE)?.value).toBeTruthy();
  });

  it("sends the next login of that account to its home", async () => {
    await createStaffAccount("kof_staff", "again@ut.mx", 3);

    for (const expected of [";/my-role;", ";/admin/kof;"]) {
      await signIn(null, credentials("again@ut.mx", PASSWORD)).catch(() => undefined);
      await expect(verifyLoginCodeAction(null, codeForm(await readCodeFor("again@ut.mx")))).rejects.toMatchObject({
        digest: expect.stringContaining(expected),
      });
    }
  });

  it("does not take a wrong code as a login: the first correct one still goes to /my-role", async () => {
    await createStaffAccount("raffle_admin", "wrong-first@ut.mx", null);
    await signIn(null, credentials("wrong-first@ut.mx", PASSWORD)).catch(() => undefined);

    const code = await readCodeFor("wrong-first@ut.mx");

    await verifyLoginCodeAction(null, codeForm(code === "000000" ? "000001" : "000000"));

    await expect(verifyLoginCodeAction(null, codeForm(code))).rejects.toMatchObject({
      digest: expect.stringContaining(";/my-role;"),
    });
  });

  it.each([
    ["kof_admin", null, ";/admin/kof;"],
    ["kof_staff", 1, ";/admin/kof;"],
    ["raffle_admin", null, ";/admin/raffle;"],
  ] as const)("sends a %s to its own home after the code", async (role, kofDesk, home) => {
    await createStaffAccount(role, `${role}@ut.mx`, kofDesk);
    await recordVerifiedLogin(`${role}@ut.mx`);
    await signIn(null, credentials(`${role}@ut.mx`, PASSWORD)).catch(() => undefined);

    const code = await readCodeFor(`${role}@ut.mx`);

    await expect(verifyLoginCodeAction(null, codeForm(code))).rejects.toMatchObject({
      digest: expect.stringContaining(home),
    });
  });

  it("answers the generic error for a wrong code and opens no session", async () => {
    const code = await signInAndReadCode();

    expect(await verifyLoginCodeAction(null, codeForm(code === "000000" ? "000001" : "000000"))).toEqual({
      error: ERRORS.invalidCode,
      notice: "",
    });
    expect(await getPrisma().session.count()).toBe(0);
  });

  it("asks for six digits without spending an attempt when the format is wrong", async () => {
    await signInAndReadCode();

    expect(await verifyLoginCodeAction(null, codeForm("12ab"))).toEqual({ error: ERRORS.invalidFormat, notice: "" });
    expect((await getPrisma().loginChallenge.findFirstOrThrow()).attempts).toBe(0);
  });

  it("refuses the right code once the attempts are exhausted", async () => {
    const code = await signInAndReadCode();
    const wrong = code === "000000" ? "000001" : "000000";

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) await verifyLoginCodeAction(null, codeForm(wrong));

    expect(await verifyLoginCodeAction(null, codeForm(code))).toEqual({ error: ERRORS.invalidCode, notice: "" });
    expect(await getPrisma().session.count()).toBe(0);
  });

  it("refuses a code that was already used", async () => {
    const code = await signInAndReadCode();

    const token = jar.get(CHALLENGE_COOKIE)?.value ?? "";

    await verifyLoginCodeAction(null, codeForm(code)).catch(() => undefined);

    jar.set(CHALLENGE_COOKIE, token);
    expect(await verifyLoginCodeAction(null, codeForm(code))).toEqual({ error: ERRORS.invalidCode, notice: "" });
    expect(await getPrisma().session.count()).toBe(1);
  });

  it("sends the person back to /login when there is no challenge cookie", async () => {
    await expect(verifyLoginCodeAction(null, codeForm("123456"))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
  });
});

describe("resendLoginCodeAction", () => {
  it("queues a new code and says so, also past three codes", async () => {
    await signInAndReadCode();

    expect(await resendLoginCodeAction()).toEqual({ error: "", notice: ACCOUNTS_COPY.verifyCode.resent });
    expect(await resendLoginCodeAction()).toEqual({ error: "", notice: ACCOUNTS_COPY.verifyCode.resent });
    expect(await resendLoginCodeAction()).toEqual({ error: "", notice: ACCOUNTS_COPY.verifyCode.resent });
    expect(await getPrisma().emailOutbox.count()).toBe(4);
  });

  it("sends the person back to /login when there is no challenge cookie", async () => {
    await expect(resendLoginCodeAction()).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });
});

async function createStaffAccount(role: string, email: string, kofDesk: number | null) {
  await getPrisma().account.create({
    data: { email, name: "Role", role, status: "active", password: await hashPassword(PASSWORD), kofDesk },
  });
}

// The accounts that already signed in once: the audit log is what tells a first login from the next ones.
async function recordVerifiedLogin(email: string) {
  const account = await getPrisma().account.findUniqueOrThrow({ where: { email } });

  await getPrisma().auditLog.create({
    data: {
      actorId: account.id,
      action: "account.login_verified",
      entityType: "account",
      entityId: account.id,
      detail: {},
    },
  });
}

async function readCodeFor(email: string): Promise<string> {
  const message = await getPrisma().emailOutbox.findFirstOrThrow({
    where: { to: email },
    orderBy: { createdAt: "desc" },
  });

  return /: (\d{6})\b/.exec(message.text)?.[1] ?? "";
}

async function signInAndReadCode(): Promise<string> {
  await signIn(null, credentials("admin@ut.mx", PASSWORD)).catch(() => undefined);

  const email = await getPrisma().emailOutbox.findFirstOrThrow({ orderBy: { createdAt: "desc" } });
  const match = /: (\d{6})\b/.exec(email.text);

  if (!match) throw new Error("The email has no code");

  return match[1];
}

function credentials(email: string, password: string) {
  const form = new FormData();

  form.set("email", email);
  form.set("password", password);

  return form;
}

function codeForm(code: string) {
  const form = new FormData();

  form.set("code", code);

  return form;
}
