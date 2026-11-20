/**
 * @jest-environment node
 */
import {
  CHALLENGE_LIFETIME_MS,
  LOGIN_CODE_TTL_MS,
  MAX_CODE_ATTEMPTS,
  resendLoginCode,
  startLoginChallenge,
  verifyLoginCode,
} from "@features/accounts/lib/server/login-challenge";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-06-01T12:00:00.000Z");

let account = { id: "", email: "", name: "Ana" };

let testNumber = 0;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The audit log only takes inserts, so each test gets its own account and reads the entries of that account.
beforeEach(async () => {
  testNumber += 1;

  await getPrisma().emailOutbox.deleteMany();

  const email = `ana${testNumber}@ut.mx`;

  const created = await getPrisma().account.create({
    data: { email, name: "Ana", role: "kof_admin", status: "active", password: "hash" },
  });

  account = { id: created.id, email, name: "Ana" };
});

describe("startLoginChallenge", () => {
  it("emails a 6-digit code, stores it only hashed and audits the send without the code", async () => {
    const { token, code } = await startAndReadCode();

    expect(code).toMatch(/^\d{6}$/);
    expect(token).not.toBe("");

    const stored = await getPrisma().loginChallenge.findFirstOrThrow({ where: { accountId: account.id } });

    expect(JSON.stringify(stored)).not.toContain(code);
    expect(stored.token).not.toBe(token);
    expect(stored.expiresAt).toEqual(new Date(NOW.getTime() + LOGIN_CODE_TTL_MS));

    const audit = await readAudit();

    expect(audit.map((entry) => entry.action)).toEqual(["account.login_code_sent"]);
    expect(JSON.stringify(audit)).not.toContain(code);
  });

  it("replaces the pending challenge of the account, so only the newest code can be used", async () => {
    const first = await startAndReadCode();
    const second = await startAndReadCode();

    expect(await verifyLoginCode(first.token, first.code, NOW)).toEqual({ status: "invalid" });
    expect(await verifyLoginCode(second.token, second.code, NOW)).toMatchObject({ status: "verified" });
  });

  it("sends a fourth code in 10 minutes: there is no send limit", async () => {
    for (let sent = 0; sent < 4; sent += 1) {
      expect(await startLoginChallenge(account, NOW)).toMatchObject({ status: "sent" });
    }

    expect(await getPrisma().emailOutbox.count({ where: { to: account.email } })).toBe(4);
  });
});

describe("verifyLoginCode", () => {
  it("accepts the right code once and answers the account and its role", async () => {
    const { token, code } = await startAndReadCode();

    expect(await verifyLoginCode(token, code, NOW)).toEqual({
      status: "verified",
      accountId: account.id,
      role: "kof_admin",
    });

    const actions = (await readAudit()).map((entry) => entry.action);

    expect(actions).toContain("account.login_verified");
  });

  it("refuses a code that was already used, even before it expires", async () => {
    const { token, code } = await startAndReadCode();

    await verifyLoginCode(token, code, NOW);

    expect(await verifyLoginCode(token, code, NOW)).toEqual({ status: "invalid" });
  });

  it("refuses a wrong code, audits the failure and keeps the right code usable", async () => {
    const { token, code } = await startAndReadCode();

    expect(await verifyLoginCode(token, otherCode(code), NOW)).toEqual({ status: "invalid" });

    const actions = (await readAudit()).map((entry) => entry.action);

    expect(actions).toContain("account.login_code_failed");
    expect(await verifyLoginCode(token, code, NOW)).toMatchObject({ status: "verified" });
  });

  it("refuses an expired code and a token nobody has with the same answer", async () => {
    const { token, code } = await startAndReadCode();
    const later = new Date(NOW.getTime() + LOGIN_CODE_TTL_MS);

    expect(await verifyLoginCode(token, code, later)).toEqual({ status: "invalid" });
    expect(await verifyLoginCode("nobody", code, NOW)).toEqual({ status: "invalid" });
  });

  it("stops accepting codes after the maximum of wrong attempts, the right one included", async () => {
    const { token, code } = await startAndReadCode();

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      expect(await verifyLoginCode(token, otherCode(code), NOW)).toEqual({ status: "invalid" });
    }

    expect(await verifyLoginCode(token, code, NOW)).toEqual({ status: "invalid" });
    expect((await getPrisma().loginChallenge.findFirstOrThrow({ where: { accountId: account.id } })).usedAt).toBeNull();
  });

  it("refuses the code of an account that was disabled after the password step", async () => {
    const { token, code } = await startAndReadCode();

    await getPrisma().account.update({ where: { id: account.id }, data: { status: "disabled" } });

    expect(await verifyLoginCode(token, code, NOW)).toEqual({ status: "invalid" });
  });

  it("lets only one of two simultaneous requests with the right code win", async () => {
    const { token, code } = await startAndReadCode();

    const results = await Promise.all([verifyLoginCode(token, code, NOW), verifyLoginCode(token, code, NOW)]);

    expect(results.filter((result) => result.status === "verified")).toHaveLength(1);
  });
});

describe("resendLoginCode", () => {
  it("sends a new code, the old one stops working and the wrong attempts start again", async () => {
    const { token, code } = await startAndReadCode();

    await verifyLoginCode(token, otherCode(code), NOW);

    const resent = await resendLoginCode(token, NOW);

    expect(resent).toMatchObject({ status: "sent" });

    const newCode = await readLatestCode();

    expect((await getPrisma().loginChallenge.findFirstOrThrow({ where: { accountId: account.id } })).attempts).toBe(0);

    if (newCode !== code) expect(await verifyLoginCode(token, code, NOW)).toEqual({ status: "invalid" });

    expect(await verifyLoginCode(token, newCode, NOW)).toMatchObject({ status: "verified" });
    expect((await readAudit()).map((entry) => entry.action)).toContain("account.login_code_resent");
  });

  it("resends past three codes: there is no send limit", async () => {
    const { token } = await startAndReadCode();

    for (let sent = 0; sent < 3; sent += 1) {
      expect(await resendLoginCode(token, NOW)).toMatchObject({ status: "sent" });
    }

    expect(await getPrisma().emailOutbox.count({ where: { to: account.email } })).toBe(4);
  });

  it("answers invalid for an unknown token, a used challenge and one older than its lifetime", async () => {
    const { token, code } = await startAndReadCode();
    const old = new Date(NOW.getTime() + CHALLENGE_LIFETIME_MS + 1);

    expect(await resendLoginCode("nobody", NOW)).toEqual({ status: "invalid" });
    expect(await resendLoginCode(token, old)).toEqual({ status: "invalid" });

    await verifyLoginCode(token, code, NOW);

    expect(await resendLoginCode(token, NOW)).toEqual({ status: "invalid" });
    expect(await getPrisma().emailOutbox.count({ where: { to: account.email } })).toBe(1);
  });
});

function readAudit() {
  return getPrisma().auditLog.findMany({ where: { entityId: account.id }, orderBy: { createdAt: "asc" } });
}

async function startAndReadCode(): Promise<{ token: string; code: string }> {
  const result = await startLoginChallenge(account, NOW);

  if (result.status !== "sent") throw new Error("Expected the code to be sent");

  return { token: result.token, code: await readLatestCode() };
}

async function readLatestCode(): Promise<string> {
  const email = await getPrisma().emailOutbox.findFirstOrThrow({
    where: { to: account.email },
    orderBy: { createdAt: "desc" },
  });

  expect(email).toMatchObject({ kind: "login_code", referenceId: account.id });

  const match = /: (\d{6})\b/.exec(email.text);

  if (!match) throw new Error("The email has no code");

  return match[1];
}

function otherCode(code: string): string {
  return code === "000000" ? "000001" : "000000";
}
