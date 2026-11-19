/**
 * @jest-environment node
 */
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { liftSysadminGuard } from "@shared/__tests__/lib/server/sysadmin-guard";

const STORED_HASH = "scrypt$131072$8$1$c2FsdA$aGFzaA";

const EXPECTED_ACCOUNT_OBJECTS = [
  "accounts_email_key",
  "accounts_keep_one_active_sysadmin_on_delete",
  "accounts_keep_one_active_sysadmin_on_update",
  "accounts_kof_desk_is_unique_on_insert",
  "accounts_kof_desk_is_unique_on_update",
  "accounts_stand_admin_is_unique_on_insert",
  "accounts_stand_admin_is_unique_on_update",
  "accounts_stand_staff_limit_on_insert",
  "accounts_stand_staff_limit_on_update",
  "sqlite_autoindex_accounts_1",
];

const EXPECTED_ACCOUNT_COLUMNS = [
  "created_at",
  "created_by_id",
  "email",
  "group",
  "id",
  "kof_desk",
  "name",
  "password_scrypt",
  "role",
  "secondary_role",
  "stand_id",
  "status",
  "studio",
];

const EXPECTED_ACCOUNT_CHECKS = [
  "accounts_email_check",
  "accounts_role_check",
  "accounts_status_check",
  "accounts_active_password_check",
  "accounts_stand_role_check",
  "accounts_kof_desk_check",
  "accounts_secondary_role_check",
];

/** sessions, audit_logs, accounts, tournament_entries, account_invitations, pending_visits, checkins, raffle_draws, recovery_tokens, login_challenges, password_reset_tokens. */
const INCOMING_FOREIGN_KEY_OWNERS = 11;

const database = createTestDatabase();

const prisma = createTestClient(database);

let ownStandId = "";

beforeAll(async () => {
  ownStandId = (await prisma.stand.create({ data: { zone: "A", number: 1, studio: 1, groupCode: "101" } })).id;
});

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  await prisma.session.deleteMany();
  await liftSysadminGuard(prisma);
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

  it("rejects a KOF desk outside 1 to 4 or on a role other than kof_staff", async () => {
    await expect(createAccount({ role: "kof_staff", status: "invited", password: null, kofDesk: 5 })).rejects.toThrow();
    await expect(createAccount({ role: "kof_staff", status: "invited", password: null, kofDesk: 0 })).rejects.toThrow();
    await expect(createAccount({ role: "kof_admin", status: "invited", password: null, kofDesk: 1 })).rejects.toThrow();
    await expect(createAccount({ role: "kof_admin", status: "invited", password: null, kofDesk: 3 })).rejects.toThrow();
    expect(await prisma.account.count()).toBe(0);
  });

  it("accepts the four KOF desks, one for each board", async () => {
    for (const desk of [1, 2, 3, 4]) {
      await createAccount({
        role: "kof_staff",
        status: "invited",
        password: null,
        email: `d${desk}@ut.mx`,
        kofDesk: desk,
      });
    }

    expect(await prisma.account.count({ where: { kofDesk: { in: [1, 2, 3, 4] } } })).toBe(4);
  });

  it.each([1, 3, 4])(
    "allows one active staff member for desk %i and frees the desk when it is disabled",
    async (desk) => {
      const first = await createAccount({ role: "kof_staff", status: "active", password: STORED_HASH, kofDesk: desk });

      await expect(
        createAccount({ role: "kof_staff", status: "invited", password: null, email: "other@ut.mx", kofDesk: desk }),
      ).rejects.toThrow();
      expect(await prisma.account.count()).toBe(1);

      await prisma.account.update({ where: { id: first.id }, data: { status: "disabled" } });
      await createAccount({
        role: "kof_staff",
        status: "invited",
        password: null,
        email: "other@ut.mx",
        kofDesk: desk,
      });

      expect(await prisma.account.count({ where: { kofDesk: desk } })).toBe(2);
    },
  );
});

// A database of its own: the file above lifts the sysadmin guard to empty the table, and this one checks the triggers.
describe("the structure of the accounts table", () => {
  const structureDatabase = createTestDatabase();
  const structure = createTestClient(structureDatabase);

  afterAll(async () => {
    await structure.$disconnect();
    structureDatabase.remove();
  });

  it("keeps every trigger and every index that the rules of the table need", async () => {
    const rows = await structure.$queryRaw<{ name: string }[]>`
      SELECT name FROM sqlite_master WHERE tbl_name = 'accounts' AND type IN ('trigger', 'index')`;

    expect(rows.map((row) => row.name).sort()).toEqual(EXPECTED_ACCOUNT_OBJECTS);
  });

  it("keeps every column and every named CHECK", async () => {
    const columns = await structure.$queryRaw<{ name: string }[]>`SELECT name FROM pragma_table_info('accounts')`;

    const [table] = await structure.$queryRaw<{ sql: string }[]>`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'accounts'`;

    expect(columns.map((column) => column.name).sort()).toEqual(EXPECTED_ACCOUNT_COLUMNS);

    for (const check of EXPECTED_ACCOUNT_CHECKS) expect(table.sql).toContain(`CONSTRAINT "${check}"`);
  });

  it("keeps the foreign keys of the accounts and of the tables that point to them", async () => {
    const own = await structure.$queryRaw<{ from: string; table: string }[]>`
      SELECT "from", "table" FROM pragma_foreign_key_list('accounts')`;

    const incoming = await structure.$queryRaw<{ owner: string }[]>`
      SELECT m.name AS owner FROM sqlite_master m, pragma_foreign_key_list(m.name) f
      WHERE m.type = 'table' AND f."table" = 'accounts'`;

    expect(own.map((key) => `${key.from}>${key.table}`).sort()).toEqual(["created_by_id>accounts", "stand_id>stands"]);
    expect(new Set(incoming.map((row) => row.owner)).size).toBe(INCOMING_FOREIGN_KEY_OWNERS);
  });
});

describe("the secondary role of an account (S1, S2)", () => {
  it.each(["help_desk", "kof_admin", "raffle_admin", "sysadmin"])(
    "accepts %s as the secondary role of a stand administrator",
    async (secondaryRole) => {
      await createAccount({ role: "stand_admin", status: "invited", password: null, stand: true, secondaryRole });

      expect(await prisma.account.count({ where: { secondaryRole } })).toBe(1);
    },
  );

  it("leaves the secondary role empty on every account that was already there", async () => {
    await createAccount({ role: "stand_admin", status: "invited", password: null, stand: true });
    await createAccount({ role: "help_desk", status: "invited", password: null, email: "help@ut.mx" });

    expect(await prisma.account.count({ where: { secondaryRole: null } })).toBe(2);
  });

  it.each([
    ["a stand staff member", { role: "stand_staff", stand: true, secondaryRole: "help_desk" }],
    ["a sysadmin", { role: "sysadmin", secondaryRole: "help_desk" }],
    ["a KOF administrator", { role: "kof_admin", secondaryRole: "raffle_admin" }],
    ["a help desk account", { role: "help_desk", secondaryRole: "sysadmin" }],
    ["a stand administrator with stand_staff", { role: "stand_admin", stand: true, secondaryRole: "stand_staff" }],
    ["a stand administrator with kof_staff", { role: "stand_admin", stand: true, secondaryRole: "kof_staff" }],
    ["a stand administrator with its own role", { role: "stand_admin", stand: true, secondaryRole: "stand_admin" }],
    ["a stand administrator with an unknown role", { role: "stand_admin", stand: true, secondaryRole: "root" }],
    ["a stand administrator with an empty role", { role: "stand_admin", stand: true, secondaryRole: "" }],
  ])("rejects %s and keeps the table unchanged", async (_case, fields) => {
    await expect(createAccount({ status: "invited", password: null, ...fields })).rejects.toThrow();
    expect(await prisma.account.count()).toBe(0);
  });

  it("rejects a secondary role added later to an account that cannot have one", async () => {
    const account = await createAccount({ role: "kof_admin", status: "invited", password: null });

    await expect(
      prisma.account.update({ where: { id: account.id }, data: { secondaryRole: "help_desk" } }),
    ).rejects.toThrow();
    expect((await prisma.account.findUniqueOrThrow({ where: { id: account.id } })).secondaryRole).toBeNull();
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
  kofDesk?: number;
  /** Gives the account the stand of the fixture. */
  stand?: boolean;
  secondaryRole?: string;
}

function createAccount({
  role,
  status,
  password,
  email = "admin@ut.mx",
  kofDesk,
  stand,
  secondaryRole,
}: AccountFields) {
  const standId = stand ? ownStandId : undefined;

  return prisma.account.create({
    data: { email, name: "Sysadmin", role, status, password, kofDesk, standId, secondaryRole },
  });
}
