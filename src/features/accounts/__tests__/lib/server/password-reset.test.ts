/**
 * @jest-environment node
 */
import {
  getResetLinkState,
  requestPasswordReset,
  RESET_LINK_LIFETIME_MS,
  resetPassword,
} from "@features/accounts/lib/server/password-reset";
import { createSession } from "@shared/lib/server/session";
import { verifyPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-06-01T12:00:00.000Z");

const NEW_PASSWORD = "a brand new password";

let accountId = "";

let email = "";

let testNumber = 0;

beforeAll(async () => {
  stubCookies(createCookieJar());
  await getPrisma().account.create({
    data: { email: "off@ut.mx", name: "Off", role: "kof_admin", status: "disabled", password: "old-hash" },
  });
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The audit log only takes inserts, so each test gets its own account and reads the entries of that account.
beforeEach(async () => {
  testNumber += 1;
  email = `ana${testNumber}@ut.mx`;
  await getPrisma().emailOutbox.deleteMany();
  accountId = (
    await getPrisma().account.create({
      data: { email, name: "Ana", role: "kof_admin", status: "active", password: "old-hash" },
    })
  ).id;
});

describe("requestPasswordReset", () => {
  it("queues one email with a link, stores only the hash of the token and audits the request", async () => {
    const emailId = await requestPasswordReset(email, NOW);
    const token = await readToken(emailId);
    const stored = await getPrisma().passwordResetToken.findFirstOrThrow();

    expect(stored.token).not.toBe(token);
    expect(stored.expiresAt).toEqual(new Date(NOW.getTime() + RESET_LINK_LIFETIME_MS));
    expect((await readAudit()).map((entry) => entry.action)).toEqual(["account.password_reset_requested"]);
  });

  it.each(["nadie@ut.mx", "off@ut.mx"])("queues nothing and stores nothing for %s", async (target) => {
    expect(await requestPasswordReset(target, NOW)).toBeNull();
    expect(await getPrisma().emailOutbox.count({ where: { to: target } })).toBe(0);
    expect(await getPrisma().passwordResetToken.count({ where: { account: { email: target } } })).toBe(0);
  });

  it("makes the previous link stop working when a new one is requested", async () => {
    const first = await readToken(await requestPasswordReset(email, NOW));

    await readToken(await requestPasswordReset(email, NOW));

    expect(await getResetLinkState(first, NOW)).toEqual({ status: "invalid" });
  });

  it("allows three requests an hour per email and queues no email for the fourth", async () => {
    expect(await requestPasswordReset(email, NOW)).not.toBeNull();
    expect(await requestPasswordReset(email, NOW)).not.toBeNull();
    expect(await requestPasswordReset(email, NOW)).not.toBeNull();

    expect(await requestPasswordReset(email, NOW)).toBeNull();
    expect(await getPrisma().emailOutbox.count({ where: { to: email } })).toBe(3);
  });
});

describe("resetPassword", () => {
  it("changes the password, uses the link, closes every session and audits it", async () => {
    stubCookies(createCookieJar());
    await createSession(accountId);

    const token = await readToken(await requestPasswordReset(email, NOW));

    expect(await resetPassword(token, NEW_PASSWORD, NOW)).toEqual({ status: "changed" });

    const account = await getPrisma().account.findUniqueOrThrow({ where: { id: accountId } });

    expect(await verifyPassword(NEW_PASSWORD, account.password ?? "")).toBe(true);
    expect(await getPrisma().session.count({ where: { accountId } })).toBe(0);
    expect((await readAudit()).map((entry) => entry.action)).toContain("account.password_reset");
  });

  it("is single-use: the second try is invalid and keeps the password of the first", async () => {
    const token = await readToken(await requestPasswordReset(email, NOW));

    await resetPassword(token, NEW_PASSWORD, NOW);

    expect(await resetPassword(token, "another password!", NOW)).toEqual({ status: "invalid" });

    const account = await getPrisma().account.findUniqueOrThrow({ where: { id: accountId } });

    expect(await verifyPassword(NEW_PASSWORD, account.password ?? "")).toBe(true);
  });

  it("lets only one of two simultaneous requests win", async () => {
    const token = await readToken(await requestPasswordReset(email, NOW));

    const results = await Promise.all([
      resetPassword(token, NEW_PASSWORD, NOW),
      resetPassword(token, NEW_PASSWORD, NOW),
    ]);

    expect(results.filter((result) => result.status === "changed")).toHaveLength(1);
  });

  it("refuses an expired link and leaves the password and the sessions unchanged", async () => {
    stubCookies(createCookieJar());
    await createSession(accountId);

    const token = await readToken(await requestPasswordReset(email, NOW));
    const later = new Date(NOW.getTime() + RESET_LINK_LIFETIME_MS);

    expect(await resetPassword(token, NEW_PASSWORD, later)).toEqual({ status: "expired" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: accountId } })).password).toBe("old-hash");
    expect(await getPrisma().session.count({ where: { accountId } })).toBe(1);
  });

  it("refuses an unknown token, and the link of an account disabled after the request", async () => {
    const token = await readToken(await requestPasswordReset(email, NOW));

    expect(await resetPassword("nobody", NEW_PASSWORD, NOW)).toEqual({ status: "invalid" });

    await getPrisma().account.update({ where: { id: accountId }, data: { status: "disabled" } });

    expect(await resetPassword(token, NEW_PASSWORD, NOW)).toEqual({ status: "invalid" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: accountId } })).password).toBe("old-hash");
  });
});

function readAudit() {
  return getPrisma().auditLog.findMany({ where: { entityId: accountId } });
}

async function readToken(emailId: string | null): Promise<string> {
  if (!emailId) throw new Error("Expected a reset email");

  const email = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: emailId } });
  expect(email).toMatchObject({ kind: "password_reset", referenceId: accountId });

  const match = /\/reset-password\/([\w-]+)/.exec(email.text);

  if (!match) throw new Error("The email has no reset link");

  return match[1];
}
