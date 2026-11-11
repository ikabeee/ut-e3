/**
 * @jest-environment node
 */
import { createHash } from "node:crypto";
import { SESSION_COOKIE } from "@shared/lib/session-cookie";
import { createSession, deleteSession, getSessionAccount } from "@shared/lib/server/session";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

let jar = createCookieJar();

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  await getPrisma().session.deleteMany();
  await getPrisma().account.deleteMany();
});

describe("createSession", () => {
  it("keeps only the SHA-256 of the cookie token and sets an httpOnly cookie for 12 hours", async () => {
    const account = await createAccount("active");
    const before = Date.now();

    await createSession(account.id);

    const cookie = jar.get(SESSION_COOKIE);
    const [session] = await getPrisma().session.findMany();

    expect(cookie?.value).toMatch(/^[\w-]{43}$/);
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", expires: session.expiresAt });
    expect(session.token).toBe(sha256(cookie?.value ?? ""));
    expect(session.expiresAt.getTime() - before).toBeGreaterThanOrEqual(TWELVE_HOURS_MS);
    expect(session.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(TWELVE_HOURS_MS);
  });
});

describe("getSessionAccount", () => {
  it("returns the account behind a valid session cookie", async () => {
    const account = await createAccount("active");

    await createSession(account.id);

    expect(await getSessionAccount()).toEqual({
      id: account.id,
      email: "admin@ut.mx",
      name: "Sysadmin",
      role: "sysadmin",
    });
  });

  it("returns null without a cookie or with a token that matches no session", async () => {
    expect(await getSessionAccount()).toBeNull();

    jar.set(SESSION_COOKIE, "not-a-session");

    expect(await getSessionAccount()).toBeNull();
  });

  it("returns null when the session has expired", async () => {
    const account = await createAccount("active");

    await getPrisma().session.create({
      data: { accountId: account.id, token: sha256("expired"), expiresAt: new Date(Date.now() - 1000) },
    });
    jar.set(SESSION_COOKIE, "expired");

    expect(await getSessionAccount()).toBeNull();
  });

  it("returns null as soon as the account is disabled", async () => {
    const account = await createAccount("active");

    await createSession(account.id);
    await getPrisma().account.update({ where: { id: account.id }, data: { status: "disabled" } });

    expect(await getSessionAccount()).toBeNull();
  });
});

describe("deleteSession", () => {
  it("removes the session row and expires the cookie", async () => {
    const account = await createAccount("active");

    await createSession(account.id);
    await deleteSession();

    expect(await getPrisma().session.count()).toBe(0);
    expect(jar.get(SESSION_COOKIE)).toMatchObject({ value: "", expires: new Date(0) });
    expect(await getSessionAccount()).toBeNull();
  });
});

function createAccount(status: string) {
  return getPrisma().account.create({
    data: { email: "admin@ut.mx", name: "Sysadmin", role: "sysadmin", status, password: "scrypt$1$1$1$a$b" },
  });
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
