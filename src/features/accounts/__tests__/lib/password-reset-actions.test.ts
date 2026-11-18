/**
 * @jest-environment node
 */
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { MIN_PASSWORD_LENGTH } from "@features/accounts/lib/invitation-rules";
import { requestPasswordResetAction, resetPasswordAction } from "@features/accounts/lib/password-reset-actions";
import { requestPasswordReset } from "@features/accounts/lib/server/password-reset";
import { verifyPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { stubAfter } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ERRORS = ACCOUNTS_COPY.resetPassword.errors;

const PASSWORD = "a long enough password";

let afterStub = stubAfter();

beforeAll(async () => {
  await getPrisma().account.create({
    data: { email: "ana@ut.mx", name: "Ana", role: "kof_admin", status: "active", password: "old-hash" },
  });
});

afterAll(async () => {
  afterStub.restore();
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  afterStub.restore();
  afterStub = stubAfter();
  await getPrisma().passwordResetToken.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().account.update({ where: { email: "ana@ut.mx" }, data: { password: "old-hash" } });
});

describe("requestPasswordResetAction", () => {
  it("answers the same generic response for an existing and an unknown email, and queues the email only for the first", async () => {
    const known = await requestPasswordResetAction(null, emailForm(" Ana@UT.mx "));
    const unknown = await requestPasswordResetAction(null, emailForm("nadie@ut.mx"));

    expect(known).toEqual({ status: "sent", error: "" });
    expect(unknown).toEqual(known);

    for (const task of afterStub.callbacks) await task();

    expect(await getPrisma().emailOutbox.findMany({ select: { to: true } })).toEqual([{ to: "ana@ut.mx" }]);
  });

  it("rejects an email without the shape of one and runs nothing after the response", async () => {
    expect(await requestPasswordResetAction(null, emailForm("not-an-email"))).toEqual({
      status: "invalid",
      error: ACCOUNTS_COPY.forgotPassword.errors.emailInvalid,
    });
    expect(afterStub.callbacks).toHaveLength(0);
    expect(await getPrisma().rateLimit.count()).toBe(0);
  });

  it("does not throw for a body that is not FormData", async () => {
    expect(await requestPasswordResetAction(null, 2)).toMatchObject({ status: "invalid" });
  });
});

describe("resetPasswordAction", () => {
  it("changes the password and sends the person to /login", async () => {
    const token = await issueToken();

    await expect(
      resetPasswordAction(null, resetForm({ token, password: PASSWORD, confirmation: PASSWORD })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: "ana@ut.mx" } });

    expect(await verifyPassword(PASSWORD, account.password ?? "")).toBe(true);
  });

  it.each([
    { label: "too short", password: "short", confirmation: "short", message: ERRORS.tooShort(MIN_PASSWORD_LENGTH) },
    { label: "unconfirmed", password: PASSWORD, confirmation: `${PASSWORD}!`, message: ERRORS.mismatch },
  ])("rejects a password that is $label and keeps the link usable", async ({ password, confirmation, message }) => {
    const token = await issueToken();

    expect(await resetPasswordAction(null, resetForm({ token, password, confirmation }))).toEqual({ error: message });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { email: "ana@ut.mx" } })).password).toBe("old-hash");

    await expect(
      resetPasswordAction(null, resetForm({ token, password: PASSWORD, confirmation: PASSWORD })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("answers the same neutral message to an unknown token and to one already used", async () => {
    const token = await issueToken();

    await resetPasswordAction(null, resetForm({ token, password: PASSWORD, confirmation: PASSWORD })).catch(
      () => undefined,
    );

    expect(await resetPasswordAction(null, resetForm({ token, password: PASSWORD, confirmation: PASSWORD }))).toEqual({
      error: ERRORS.invalid,
    });
    expect(
      await resetPasswordAction(null, resetForm({ token: "nobody", password: PASSWORD, confirmation: PASSWORD })),
    ).toEqual({ error: ERRORS.invalid });
  });

  it("says that a link older than one hour expired", async () => {
    const token = await issueToken(new Date("2026-01-01T12:00:00.000Z"));

    expect(await resetPasswordAction(null, resetForm({ token, password: PASSWORD, confirmation: PASSWORD }))).toEqual({
      error: ERRORS.expired,
    });
  });
});

async function issueToken(requestedAt = new Date()): Promise<string> {
  await getPrisma().rateLimit.deleteMany();

  const emailId = await requestPasswordReset("ana@ut.mx", requestedAt);
  const email = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: emailId ?? "" } });
  const match = /\/reset-password\/([\w-]+)/.exec(email.text);

  if (!match) throw new Error("The email has no reset link");

  return match[1];
}

function emailForm(email: string): FormData {
  return resetForm({ email });
}

function resetForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.append(name, value));

  return form;
}
