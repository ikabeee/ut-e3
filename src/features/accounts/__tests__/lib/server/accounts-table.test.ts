/**
 * @jest-environment node
 */
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const STORED_HASH = "scrypt$131072$8$1$c2FsdA$aGFzaA";

const database = createTestDatabase();

const prisma = createTestClient(database);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
});

describe("accounts table", () => {
  it("accepts an active sysadmin with a password", async () => {
    await createAccount({ role: "sysadmin", status: "active", password: STORED_HASH });

    expect(await prisma.account.count()).toBe(1);
  });

  it("accepts an invited account that has no password yet", async () => {
    await createAccount({ role: "raffle_admin", status: "invited", password: null });

    expect(await prisma.account.count()).toBe(1);
  });

  it.each([
    ["an unknown role", { role: "root", status: "active", password: STORED_HASH }],
    ["an unknown status", { role: "sysadmin", status: "locked", password: STORED_HASH }],
    ["an active account without a password", { role: "sysadmin", status: "active", password: null }],
  ])("rejects %s and keeps the table unchanged", async (_case, account) => {
    await expect(createAccount(account)).rejects.toThrow();
    expect(await prisma.account.count()).toBe(0);
  });

  it("rejects an email that is not lowercase", async () => {
    await expect(
      createAccount({ role: "sysadmin", status: "active", password: STORED_HASH, email: "Admin@UT.mx" }),
    ).rejects.toThrow();
    expect(await prisma.account.count()).toBe(0);
  });

  it("rejects a second account with the same email", async () => {
    await createAccount({ role: "sysadmin", status: "active", password: STORED_HASH });

    await expect(createAccount({ role: "help_desk", status: "invited", password: null })).rejects.toThrow();
    expect(await prisma.account.count()).toBe(1);
  });

  it("rejects a stand role without a stand", async () => {
    await expect(createAccount({ role: "stand_admin", status: "invited", password: null })).rejects.toThrow();
    expect(await prisma.account.count()).toBe(0);
  });

  it("rejects a KOF board outside 1 to 4 or on a role other than kof_staff", async () => {
    await expect(
      createAccount({ role: "kof_staff", status: "invited", password: null, kofBoard: 5 }),
    ).rejects.toThrow();
    await expect(
      createAccount({ role: "kof_admin", status: "invited", password: null, kofBoard: 1 }),
    ).rejects.toThrow();
    expect(await prisma.account.count()).toBe(0);
  });
});

describe("sessions table", () => {
  it("stores the token in token_sha256 and removes the sessions of a deleted account", async () => {
    const account = await createAccount({ role: "sysadmin", status: "active", password: STORED_HASH });

    await prisma.session.create({
      data: { accountId: account.id, token: "a".repeat(64), expiresAt: new Date("2026-11-20T17:00:00.000Z") },
    });
    const [column] = await prisma.$queryRaw<{ token_sha256: string }[]>`SELECT token_sha256 FROM sessions`;

    expect(column.token_sha256).toBe("a".repeat(64));

    await prisma.account.delete({ where: { id: account.id } });

    expect(await prisma.session.count()).toBe(0);
  });
});

interface AccountFields {
  role: string;
  status: string;
  password: string | null;
  email?: string;
  kofBoard?: number;
}

function createAccount({ role, status, password, email = "admin@ut.mx", kofBoard }: AccountFields) {
  return prisma.account.create({ data: { email, name: "Sysadmin", role, status, password, kofBoard } });
}
