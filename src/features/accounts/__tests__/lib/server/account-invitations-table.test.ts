/**
 * @jest-environment node
 */
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const EXPIRES_AT = new Date("2026-11-01T12:00:00.000Z");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().accountInvitation.deleteMany();
  await getPrisma().account.deleteMany();
});

describe("account_invitations table", () => {
  it("stores the hash of the token in token_sha256, unused and with its expiry", async () => {
    const account = await createAccount("admin@ut.mx", "kof_admin");

    await getPrisma().accountInvitation.create({
      data: { accountId: account.id, token: "a".repeat(64), expiresAt: EXPIRES_AT },
    });

    const [column] = await getPrisma().$queryRaw<
      { token_sha256: string }[]
    >`SELECT token_sha256 FROM account_invitations`;

    const invitation = await getPrisma().accountInvitation.findFirstOrThrow();

    expect(column.token_sha256).toBe("a".repeat(64));
    expect(invitation).toMatchObject({ accountId: account.id, usedAt: null, expiresAt: EXPIRES_AT });
  });

  it("never repeats a token", async () => {
    const first = await createAccount("one@ut.mx", "kof_admin");
    const second = await createAccount("two@ut.mx", "help_desk");

    await getPrisma().accountInvitation.create({
      data: { accountId: first.id, token: "b".repeat(64), expiresAt: EXPIRES_AT },
    });

    await expect(
      getPrisma().accountInvitation.create({
        data: { accountId: second.id, token: "b".repeat(64), expiresAt: EXPIRES_AT },
      }),
    ).rejects.toThrow();
  });

  it("goes away with its account", async () => {
    const account = await createAccount("admin@ut.mx", "kof_admin");

    await getPrisma().accountInvitation.create({
      data: { accountId: account.id, token: "c".repeat(64), expiresAt: EXPIRES_AT },
    });
    await getPrisma().account.delete({ where: { id: account.id } });

    expect(await getPrisma().accountInvitation.count()).toBe(0);
  });
});

describe("one KOF staff member for each desk (UT-AC-14)", () => {
  it("rejects a second staff member on a desk that is taken, invited or active", async () => {
    await createAccount("staff1@ut.mx", "kof_staff", { status: "invited", kofDesk: 1 });

    await expect(createAccount("staff2@ut.mx", "kof_staff", { status: "invited", kofDesk: 1 })).rejects.toThrow();
    await expect(
      createAccount("staff3@ut.mx", "kof_staff", { status: "active", kofDesk: 1, password: "hash" }),
    ).rejects.toThrow();
    expect(await getPrisma().account.count()).toBe(1);
  });

  it("lets each desk have its own staff member and does not count the administrator", async () => {
    await createAccount("staff1@ut.mx", "kof_staff", { status: "invited", kofDesk: 1 });
    await createAccount("staff2@ut.mx", "kof_staff", { status: "invited", kofDesk: 2 });
    await createAccount("admin@ut.mx", "kof_admin");

    expect(await getPrisma().account.count()).toBe(3);
  });

  it("frees the desk when the staff member is disabled, so the account can be replaced", async () => {
    const old = await createAccount("old@ut.mx", "kof_staff", { status: "invited", kofDesk: 2 });

    await getPrisma().account.update({ where: { id: old.id }, data: { status: "disabled" } });

    expect(await createAccount("new@ut.mx", "kof_staff", { status: "invited", kofDesk: 2 })).toMatchObject({
      kofDesk: 2,
    });
  });

  it("rejects enabling a disabled account while someone else has its desk", async () => {
    const old = await createAccount("old@ut.mx", "kof_staff", { status: "disabled", kofDesk: 2 });

    await createAccount("new@ut.mx", "kof_staff", { status: "invited", kofDesk: 2 });

    await expect(getPrisma().account.update({ where: { id: old.id }, data: { status: "invited" } })).rejects.toThrow();
  });

  it("rejects moving a staff member to a desk that is taken", async () => {
    await createAccount("staff1@ut.mx", "kof_staff", { status: "invited", kofDesk: 1 });

    const second = await createAccount("staff2@ut.mx", "kof_staff", { status: "invited", kofDesk: 2 });

    await expect(getPrisma().account.update({ where: { id: second.id }, data: { kofDesk: 1 } })).rejects.toThrow();
  });
});

interface AccountOptions {
  status?: string;
  kofDesk?: number;
  password?: string;
}

function createAccount(email: string, role: string, options: AccountOptions = {}) {
  const { status = "invited", kofDesk, password } = options;

  return getPrisma().account.create({ data: { email, name: email, role, status, password, kofDesk } });
}
