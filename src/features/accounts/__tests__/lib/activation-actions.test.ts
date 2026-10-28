/**
 * @jest-environment node
 */
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { activateAccountAction } from "@features/accounts/lib/activation-actions";
import { MIN_PASSWORD_LENGTH } from "@features/accounts/lib/invitation-rules";
import { inviteAccount } from "@features/accounts/lib/server/invitations";
import { verifyPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ERRORS = ACCOUNTS_COPY.activate.errors;

const PASSWORD = "a long enough password";

let sysadminId = "";

let testNumber = 0;

beforeAll(async () => {
  sysadminId = (
    await getPrisma().account.create({
      data: { email: "sysadmin@ut.mx", name: "Sysadmin", role: "sysadmin", status: "active", password: "hash" },
    })
  ).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(() => {
  testNumber += 1;
});

describe("activateAccountAction", () => {
  it("activates the account with the password and sends the person to /login", async () => {
    const token = await inviteAndReadToken(new Date());

    await expect(
      activateAccountAction(null, createForm({ token, password: PASSWORD, confirmation: PASSWORD })),
    ).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } });

    expect(account.status).toBe("active");
    expect(await verifyPassword(PASSWORD, account.password ?? "")).toBe(true);
  });

  it.each([
    {
      label: "a password that is too short",
      password: "short",
      confirmation: "short",
      message: ERRORS.tooShort(MIN_PASSWORD_LENGTH),
    },
    {
      label: "a confirmation that does not match",
      password: PASSWORD,
      confirmation: `${PASSWORD}!`,
      message: ERRORS.mismatch,
    },
  ])("answers $label and keeps the invitation usable", async ({ password, confirmation, message }) => {
    const token = await inviteAndReadToken(new Date());

    expect(await activateAccountAction(null, createForm({ token, password, confirmation }))).toEqual({
      error: message,
    });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } })).status).toBe("invited");

    await expect(
      activateAccountAction(null, createForm({ token, password: PASSWORD, confirmation: PASSWORD })),
    ).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
  });

  it("says that a link older than 72 hours expired and leaves the account invited", async () => {
    const token = await inviteAndReadToken(new Date("2026-01-01T12:00:00.000Z"));

    expect(
      await activateAccountAction(null, createForm({ token, password: PASSWORD, confirmation: PASSWORD })),
    ).toEqual({
      error: ERRORS.expired,
    });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } })).status).toBe("invited");
  });

  it("answers the same neutral message to a token nobody has and to one that was already used", async () => {
    const token = await inviteAndReadToken(new Date());
    const form = createForm({ token, password: PASSWORD, confirmation: PASSWORD });

    await expect(activateAccountAction(null, form)).rejects.toBeDefined();

    expect(
      await activateAccountAction(null, createForm({ token, password: PASSWORD, confirmation: PASSWORD })),
    ).toEqual({
      error: ERRORS.invalid,
    });
    expect(
      await activateAccountAction(null, createForm({ token: "nobody", password: PASSWORD, confirmation: PASSWORD })),
    ).toEqual({ error: ERRORS.invalid });
    expect(await activateAccountAction(null, createForm({ password: PASSWORD, confirmation: PASSWORD }))).toEqual({
      error: ERRORS.invalid,
    });
  });
});

async function inviteAndReadToken(sentAt: Date): Promise<string> {
  const result = await inviteAccount(
    { id: sysadminId, role: "sysadmin" },
    { name: "Ana", email: mail("ana"), role: "kof_admin", kofDesk: null },
    sentAt,
  );

  if (result.status !== "invited") throw new Error("Expected the invitation to be sent");

  const email = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: result.emailId } });
  const match = /\/activate\/([\w-]+)/.exec(email.text);

  if (!match) throw new Error("The email has no activation link");

  return match[1];
}

function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}

function createForm(fields: Record<string, string>): FormData {
  const form = new FormData();

  Object.entries(fields).forEach(([name, value]) => form.append(name, value));

  return form;
}
