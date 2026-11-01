/**
 * @jest-environment node
 */
import {
  activateAccount,
  disableAccount,
  getInvitationState,
  inviteAccount,
  listManagedAccounts,
  resendInvitation,
} from "@features/accounts/lib/server/invitations";
import { INVITATION_TTL_MS } from "@features/accounts/lib/invitation-rules";
import { verifyPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-01T12:00:00.000Z");

const PASSWORD = "a long enough password";

interface Actor {
  id: string;
  role: string;
}

const actors: Record<"sysadmin" | "kofAdmin" | "helpDesk", Actor> = {
  sysadmin: { id: "", role: "sysadmin" },
  kofAdmin: { id: "", role: "kof_admin" },
  helpDesk: { id: "", role: "help_desk" },
};

let testNumber = 0;

beforeAll(async () => {
  actors.sysadmin.id = await createActiveAccount("sysadmin@ut.mx", "sysadmin");
  actors.kofAdmin.id = await createActiveAccount("kof-admin@ut.mx", "kof_admin");
  actors.helpDesk.id = await createActiveAccount("help@ut.mx", "help_desk");
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// Accounts with an audit entry cannot be deleted, so each test starts by freeing the desks and clearing the rest.
beforeEach(async () => {
  testNumber += 1;
  await getPrisma().session.deleteMany();
  await getPrisma().accountInvitation.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().account.updateMany({ where: { role: "kof_staff" }, data: { status: "disabled" } });
});

describe("inviteAccount", () => {
  it("creates an invited account, its invitation, the email and the audit entry together (S1, S2, S4)", async () => {
    const result = await inviteAccount(actors.sysadmin, invite(`  ${mail("ana").toUpperCase()} `, "kof_admin"), NOW);

    expect(result).toEqual({ status: "invited", accountId: expect.any(String), emailId: expect.any(String) });

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } });
    const invitation = await getPrisma().accountInvitation.findFirstOrThrow({ where: { accountId: account.id } });
    const email = await getPrisma().emailOutbox.findFirstOrThrow();
    const token = readToken(email.text);

    expect(account).toMatchObject({
      role: "kof_admin",
      status: "invited",
      password: null,
      name: "Ana Pérez",
      createdById: actors.sysadmin.id,
    });
    expect(invitation.expiresAt).toEqual(new Date(NOW.getTime() + INVITATION_TTL_MS));
    expect(invitation.usedAt).toBeNull();
    expect(invitation.token).toBe(hashToken(token));
    expect(invitation.token).not.toBe(token);
    expect(email.to).toBe(mail("ana"));
    expect(email.text).toContain(`/activate/${token}`);
  });

  it("writes an audit entry without the email address", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } });

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "account.invite", entityId: account.id },
    });

    expect(entry).toMatchObject({ actorId: actors.sysadmin.id, entityType: "account" });
    expect(entry.detail).toEqual({ role: "kof_admin", kofDesk: null });
  });

  it("lets the KOF administrator invite the staff of a desk (S3)", async () => {
    const result = await inviteAccount(actors.kofAdmin, invite(mail("luis"), "kof_staff", 1), NOW);

    expect(result.status).toBe("invited");
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: mail("luis") } })).toMatchObject({
      role: "kof_staff",
      kofDesk: 1,
      status: "invited",
    });
  });

  it.each([
    { label: "the sysadmin inviting a KOF staff member", actor: "sysadmin", role: "kof_staff", desk: 1 },
    { label: "the sysadmin inviting another sysadmin", actor: "sysadmin", role: "sysadmin", desk: null },
    { label: "the KOF administrator inviting an administrator", actor: "kofAdmin", role: "kof_admin", desk: null },
    { label: "the help desk inviting anyone", actor: "helpDesk", role: "kof_staff", desk: 1 },
  ] as const)("refuses $label and creates nothing (S7)", async ({ actor, role, desk }) => {
    expect(await inviteAccount(actors[actor], invite(mail("a"), role, desk), NOW)).toEqual({ status: "forbidden" });
    expect(await getPrisma().account.findUnique({ where: { email: mail("a") } })).toBeNull();
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it.each([
    { label: "a KOF staff member without a desk", actor: "kofAdmin", role: "kof_staff", desk: null },
    { label: "an administrator with a desk", actor: "sysadmin", role: "kof_admin", desk: 1 },
  ] as const)("rejects $label", async ({ actor, role, desk }) => {
    expect(await inviteAccount(actors[actor], invite(mail("a"), role, desk), NOW)).toEqual({ status: "invalidDesk" });
    expect(await getPrisma().account.findUnique({ where: { email: mail("a") } })).toBeNull();
  });

  it("does not repeat an email, whatever its case", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);

    expect(await inviteAccount(actors.sysadmin, invite(mail("ana").toUpperCase(), "help_desk"), NOW)).toEqual({
      status: "emailTaken",
    });
    expect(await inviteAccount(actors.sysadmin, invite("sysadmin@ut.mx", "help_desk"), NOW)).toEqual({
      status: "emailTaken",
    });
    expect(await getPrisma().emailOutbox.count()).toBe(1);
  });

  it("does not turn an email that has a passport into an account (RN-02)", async () => {
    await getPrisma().visitor.create({
      data: { fullName: "Neo", gamertag: "Neo", email: "neo@matrix.org", pin: "x", pinLookup: "y" },
    });

    expect(await inviteAccount(actors.sysadmin, invite("NEO@matrix.org", "help_desk"), NOW)).toEqual({
      status: "hasPassport",
    });
    expect(await getPrisma().account.findUnique({ where: { email: "neo@matrix.org" } })).toBeNull();
  });

  it("gives a desk to one staff member at a time and frees it when the account is disabled (UT-AC-14)", async () => {
    await inviteAccount(actors.kofAdmin, invite(mail("old"), "kof_staff", 2), NOW);

    expect(await inviteAccount(actors.kofAdmin, invite(mail("new"), "kof_staff", 2), NOW)).toEqual({
      status: "deskTaken",
    });

    const old = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("old") } });

    await disableAccount(actors.kofAdmin, old.id);

    expect((await inviteAccount(actors.kofAdmin, invite(mail("new"), "kof_staff", 2), NOW)).status).toBe("invited");
  });

  it("lets only one of two simultaneous invitations take a desk", async () => {
    const results = await Promise.all([
      inviteAccount(actors.kofAdmin, invite(mail("one"), "kof_staff", 1), NOW),
      inviteAccount(actors.kofAdmin, invite(mail("two"), "kof_staff", 1), NOW),
    ]);

    expect(results.map((result) => result.status).toSorted()).toEqual(["deskTaken", "invited"]);
    expect(await getPrisma().emailOutbox.count()).toBe(1);
  });
});

describe("resendInvitation", () => {
  it("sends a new link and leaves the old one useless (S1, S5)", async () => {
    const accountId = await inviteAndGetId(actors.sysadmin, invite(mail("ana"), "kof_admin"));
    const oldToken = await readLastToken();

    const result = await resendInvitation(actors.sysadmin, accountId, NOW);
    const newToken = await readLastToken(oldToken);

    expect(result).toEqual({ status: "sent", emailId: expect.any(String) });
    expect(newToken).not.toBe(oldToken);
    expect(await getInvitationState(oldToken, NOW)).toEqual({ status: "invalid" });
    expect(await getInvitationState(newToken, NOW)).toEqual({ status: "valid", name: "Ana Pérez" });
    expect(await getPrisma().accountInvitation.count({ where: { accountId } })).toBe(1);
    expect(await getPrisma().emailOutbox.count()).toBe(2);
    expect(
      await getPrisma().auditLog.count({ where: { action: "account.resend_invitation", entityId: accountId } }),
    ).toBe(1);
  });

  it("only resends to an account that has not been activated", async () => {
    const accountId = await inviteAndGetId(actors.sysadmin, invite(mail("ana"), "kof_admin"));

    await activateAccount(await readLastToken(), PASSWORD, NOW);

    expect(await resendInvitation(actors.sysadmin, accountId, NOW)).toEqual({ status: "wrongState" });
  });

  it("refuses an account of a role the actor does not manage, and an account that does not exist", async () => {
    const adminId = await inviteAndGetId(actors.sysadmin, invite(mail("ana"), "kof_admin"));
    const staffId = await inviteAndGetId(actors.kofAdmin, invite(mail("luis"), "kof_staff", 1));

    expect(await resendInvitation(actors.kofAdmin, adminId, NOW)).toEqual({ status: "forbidden" });
    expect(await resendInvitation(actors.sysadmin, staffId, NOW)).toEqual({ status: "forbidden" });
    expect(await resendInvitation(actors.sysadmin, "missing", NOW)).toEqual({ status: "notFound" });
  });
});

describe("disableAccount", () => {
  it("disables an active account, closes its sessions and writes the audit entry (S5)", async () => {
    const accountId = await inviteAndGetId(actors.kofAdmin, invite(mail("luis"), "kof_staff", 1));

    await activateAccount(await readLastToken(), PASSWORD, NOW);
    await getPrisma().session.create({
      data: { accountId, token: "s".repeat(64), expiresAt: new Date(NOW.getTime() + 1000) },
    });

    expect(await disableAccount(actors.kofAdmin, accountId)).toEqual({ status: "disabled" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { id: accountId } })).status).toBe("disabled");
    expect(await getPrisma().session.count({ where: { accountId } })).toBe(0);
    expect(await getPrisma().auditLog.count({ where: { action: "account.disable", entityId: accountId } })).toBe(1);
  });

  it("makes the invitation of a disabled account useless", async () => {
    const accountId = await inviteAndGetId(actors.sysadmin, invite(mail("ana"), "kof_admin"));
    const token = await readLastToken();

    await disableAccount(actors.sysadmin, accountId);

    expect(await getInvitationState(token, NOW)).toEqual({ status: "invalid" });
    expect(await activateAccount(token, PASSWORD, NOW)).toEqual({ status: "invalid" });
  });

  it("refuses an account of another role, one that is already disabled and one that does not exist", async () => {
    const adminId = await inviteAndGetId(actors.sysadmin, invite(mail("ana"), "kof_admin"));

    expect(await disableAccount(actors.kofAdmin, adminId)).toEqual({ status: "forbidden" });
    expect(await disableAccount(actors.sysadmin, "missing")).toEqual({ status: "notFound" });

    await disableAccount(actors.sysadmin, adminId);

    expect(await disableAccount(actors.sysadmin, adminId)).toEqual({ status: "wrongState" });
  });
});

describe("activation (S6)", () => {
  it("shows the name of the person while the link is valid", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);

    expect(await getInvitationState(await readLastToken(), NOW)).toEqual({ status: "valid", name: "Ana Pérez" });
  });

  it("activates the account with the password and uses the invitation up", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);

    const token = await readLastToken();
    const later = new Date(NOW.getTime() + 60_000);

    expect(await activateAccount(token, PASSWORD, later)).toEqual({ status: "activated" });

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } });
    const invitation = await getPrisma().accountInvitation.findFirstOrThrow({ where: { accountId: account.id } });

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "account.activate", entityId: account.id },
    });

    expect(account.status).toBe("active");
    expect(await verifyPassword(PASSWORD, account.password ?? "")).toBe(true);
    expect(account.password).not.toContain(PASSWORD);
    expect(invitation.usedAt).toEqual(later);
    expect(entry.actorId).toBe(account.id);
  });

  it("works once", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);

    const token = await readLastToken();

    await activateAccount(token, PASSWORD, NOW);

    expect(await activateAccount(token, "another long password", NOW)).toEqual({ status: "invalid" });
    expect(await getInvitationState(token, NOW)).toEqual({ status: "invalid" });
  });

  it("expires 72 hours after it was sent and leaves the account invited", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);

    const token = await readLastToken();
    const atExpiry = new Date(NOW.getTime() + INVITATION_TTL_MS);
    const justBefore = new Date(atExpiry.getTime() - 1);

    expect(await getInvitationState(token, justBefore)).toEqual({ status: "valid", name: "Ana Pérez" });
    expect(await getInvitationState(token, atExpiry)).toEqual({ status: "expired" });
    expect(await activateAccount(token, PASSWORD, atExpiry)).toEqual({ status: "expired" });
    expect((await getPrisma().account.findUniqueOrThrow({ where: { email: mail("ana") } })).status).toBe("invited");
  });

  it("answers the same neutral state to a token nobody has", async () => {
    expect(await getInvitationState("not-a-token", NOW)).toEqual({ status: "invalid" });
    expect(await activateAccount("not-a-token", PASSWORD, NOW)).toEqual({ status: "invalid" });
  });

  it("lets only one of two simultaneous activations win", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);

    const token = await readLastToken();

    const results = await Promise.all([
      activateAccount(token, PASSWORD, NOW),
      activateAccount(token, "a different long password", NOW),
    ]);

    expect(results.map((result) => result.status).toSorted()).toEqual(["activated", "invalid"]);
  });
});

describe("listManagedAccounts", () => {
  it("shows the sysadmin the administrators it manages and nobody else", async () => {
    await inviteAccount(actors.sysadmin, invite(mail("ana"), "kof_admin"), NOW);
    await inviteAccount(actors.kofAdmin, invite(mail("luis"), "kof_staff", 1), NOW);

    const accounts = await listManagedAccounts("sysadmin");

    expect(accounts.map((account) => account.role)).not.toContain("sysadmin");
    expect(accounts.map((account) => account.role)).not.toContain("kof_staff");
    expect(accounts.find((account) => account.email === mail("ana"))).toMatchObject({
      name: "Ana Pérez",
      status: "invited",
      kofDesk: null,
    });
  });

  it("shows the KOF administrator its staff with the desk", async () => {
    await inviteAccount(actors.kofAdmin, invite(mail("luis"), "kof_staff", 1), NOW);

    const accounts = await listManagedAccounts("kof_admin");

    expect(accounts.every((account) => account.role === "kof_staff")).toBe(true);
    expect(accounts.find((account) => account.email === mail("luis"))).toMatchObject({ kofDesk: 1, status: "invited" });
  });

  it("shows nothing to a role that manages nobody", async () => {
    expect(await listManagedAccounts("help_desk")).toEqual([]);
  });
});

// Accounts that have an audit entry stay in the database, so each test uses emails of its own.
function mail(local: string): string {
  return `t${testNumber}${local}@ut.mx`;
}

async function createActiveAccount(email: string, role: string): Promise<string> {
  const account = await getPrisma().account.create({
    data: { email, name: email, role, status: "active", password: "scrypt$1$1$1$a$b" },
  });

  return account.id;
}

async function inviteAndGetId(actor: Actor, input: ReturnType<typeof invite>) {
  await inviteAccount(actor, input, NOW);

  return (await getPrisma().account.findUniqueOrThrow({ where: { email: input.email } })).id;
}

function invite(email: string, role: string, kofDesk: 1 | 2 | null = null) {
  return { name: "Ana Pérez", email, role, kofDesk };
}

async function readLastToken(except?: string): Promise<string> {
  const emails = await getPrisma().emailOutbox.findMany({ orderBy: { createdAt: "desc" } });
  const tokens = emails.map((email) => readToken(email.text)).filter((token) => token !== except);

  if (tokens.length === 0) throw new Error("There is no activation link to read");

  return tokens[0];
}

function readToken(text: string): string {
  const match = /\/activate\/([\w-]+)/.exec(text);

  if (!match) throw new Error("The email has no activation link");

  return match[1];
}
