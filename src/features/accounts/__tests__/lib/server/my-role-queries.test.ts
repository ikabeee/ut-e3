/**
 * @jest-environment node
 */
import { getMyRoleDetails, isFirstVerifiedLogin } from "@features/accounts/lib/server/my-role-queries";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let standId = "";

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

// The audit log only admits inserts and its rows hold their accounts, so nothing is deleted: every test makes its own
// stand and its own emails.
let counter = 0;

beforeEach(async () => {
  counter += 1;
  standId = (await getPrisma().stand.create({ data: { zone: "A", number: counter, studio: 6, groupCode: "101" } })).id;
});

describe("getMyRoleDetails", () => {
  it("gives the stand, its game and the active administrator to a stand staff member", async () => {
    await createGame("Make 'Em Fall");
    await createAccount({ email: mail("rosa"), name: "Rosa Pérez", role: "stand_admin", standId });

    const staff = await createAccount({ email: mail("luis"), name: "Luis", role: "stand_staff", standId });

    expect(await getMyRoleDetails(staff.id)).toEqual({
      stand: {
        zone: "A",
        number: counter,
        studio: 6,
        groupCode: "101",
        gameName: "Make 'Em Fall",
        adminName: "Rosa Pérez",
      },
      kofDesk: null,
    });
  });

  it("gives no administrator name when the administrator is disabled or only invited", async () => {
    await createAccount({ email: mail("off"), name: "Baja", role: "stand_admin", standId, status: "disabled" });

    const staff = await createAccount({ email: mail("luis"), name: "Luis", role: "stand_staff", standId });

    expect(await getMyRoleDetails(staff.id)).toMatchObject({ stand: { adminName: null, gameName: null } });
  });

  it("does not take the administrator of another stand", async () => {
    const other = await getPrisma().stand.create({ data: { zone: "B", number: counter, studio: 1, groupCode: "102" } });

    await createAccount({ email: mail("otra"), name: "Otra", role: "stand_admin", standId: other.id });

    const staff = await createAccount({ email: mail("luis"), name: "Luis", role: "stand_staff", standId });

    expect(await getMyRoleDetails(staff.id)).toMatchObject({ stand: { adminName: null } });
  });

  it("gives the desk of a KOF staff member and no stand", async () => {
    const staff = await createAccount({ email: mail("kof"), name: "Kof", role: "kof_staff", kofDesk: 3 });

    expect(await getMyRoleDetails(staff.id)).toEqual({ stand: null, kofDesk: 3 });
  });

  it("gives the stand of a stand administrator with a secondary role", async () => {
    const admin = await createAccount({
      email: mail("dos"),
      name: "Dos Roles",
      role: "stand_admin",
      secondaryRole: "kof_admin",
      standId,
    });

    expect(await getMyRoleDetails(admin.id)).toMatchObject({
      stand: { zone: "A", number: counter, adminName: "Dos Roles" },
      kofDesk: null,
    });
  });

  it("gives nothing to an account without stand or desk, and to an account that does not exist", async () => {
    const raffle = await createAccount({ email: mail("rifa"), name: "Rifa", role: "raffle_admin" });

    expect(await getMyRoleDetails(raffle.id)).toEqual({ stand: null, kofDesk: null });
    expect(await getMyRoleDetails("missing")).toEqual({ stand: null, kofDesk: null });
  });
});

describe("isFirstVerifiedLogin", () => {
  it("is true when the only verified login of the account is the one that was just recorded", async () => {
    const account = await createAccount({ email: mail("a"), name: "A", role: "help_desk" });

    await recordLogin(account.id);

    expect(await isFirstVerifiedLogin(account.id)).toBe(true);
  });

  it("is false once the account had a verified login before", async () => {
    const account = await createAccount({ email: mail("a"), name: "A", role: "help_desk" });

    await recordLogin(account.id);
    await recordLogin(account.id);

    expect(await isFirstVerifiedLogin(account.id)).toBe(false);
  });

  it("ignores the logins of other accounts and the failed codes", async () => {
    const account = await createAccount({ email: mail("a"), name: "A", role: "help_desk" });
    const other = await createAccount({ email: mail("b"), name: "B", role: "help_desk" });

    await recordLogin(other.id);
    await recordLogin(other.id);
    await recordLogin(account.id, "account.login_code_failed");
    await recordLogin(account.id);

    expect(await isFirstVerifiedLogin(account.id)).toBe(true);
  });
});

interface AccountData {
  email: string;
  name: string;
  role: string;
  status?: string;
  standId?: string;
  secondaryRole?: string;
  kofDesk?: number;
}

// A different address in every test, because the accounts that signed in cannot be deleted.
function mail(name: string): string {
  return `${name}-${counter}@ut.mx`;
}

function createAccount(data: AccountData) {
  return getPrisma().account.create({ data: { status: "active", password: "unused", ...data } });
}

function recordLogin(accountId: string, action = "account.login_verified") {
  return getPrisma().auditLog.create({
    data: { actorId: accountId, action, entityType: "account", entityId: accountId, detail: {} },
  });
}

async function createGame(name: string) {
  const genre = await getPrisma().genre.create({ data: { name: `Acción ${counter}`, slug: `accion-${counter}` } });

  await getPrisma().game.create({
    data: { standId, name, slug: `juego-${counter}`, synopsis: "Un juego de prueba.", genreId: genre.id },
  });
}
