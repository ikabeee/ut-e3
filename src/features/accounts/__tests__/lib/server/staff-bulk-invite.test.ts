/**
 * @jest-environment node
 */
import { INVITATION_TTL_MS } from "@features/accounts/lib/invitation-rules";
import { getInvitationState, resendInvitation, type ManagingActor } from "@features/accounts/lib/server/invitations";
import { inviteStaffFromCsv, type StandSlot } from "@features/accounts/lib/server/staff-bulk-invite";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-21T12:00:00.000Z");

const HEADER = "email,name,role,secondary_role,stand,kof_desk";

// The stands of the event as the script receives them from INITIAL_STANDS; the test list has four of the eighteen.
const STANDS: StandSlot[] = [
  { zone: "C", number: 3, studio: 5, groupCode: "101" },
  { zone: "A", number: 1, studio: 6, groupCode: "101" },
  { zone: "T", number: 1, studio: 6, groupCode: "102" },
  { zone: "B", number: 3, studio: 3, groupCode: "103" },
];

const INVITED_EMAILS = ["kof", "lider1", "lider2", "mesa1", "mesa2", "staff102", "staff1"].map(
  (name) => `${name}@ut.mx`,
);

const sysadmin: ManagingActor = { id: "", role: "sysadmin", standId: null };

let fullStandId = "";

let adminStandId = "";

beforeAll(async () => {
  sysadmin.id = await createAccount({ email: "root@ut.mx", role: "sysadmin", status: "active", password: "hash" });

  // 101-6 (A1) already exists with its 3 staff, and 103-3 (B3) with its administrator; both with data of their own.
  fullStandId = await createStand({ zone: "A", number: 1, studio: 1, groupCode: "199" });
  adminStandId = await createStand({ zone: "B", number: 3, studio: 1, groupCode: "199" });

  for (const index of [1, 2, 3]) {
    await createAccount({ email: `old-staff-${index}@ut.mx`, role: "stand_staff", standId: fullStandId });
  }

  await createAccount({ email: "old-admin@ut.mx", role: "stand_admin", standId: adminStandId });
  await createAccount({ email: "old-desk@ut.mx", role: "kof_staff", kofDesk: 4 });
  await createAccount({ email: "existente@ut.mx", role: "help_desk", status: "active", password: "hash" });
  await getPrisma().visitor.create({
    data: { fullName: "Neo", gamertag: "Neo", email: "Staff1@ut.mx", pin: "x", pinLookup: "y" },
  });
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("a list that is not valid writes nothing (T7)", () => {
  it("refuses a list with an error in the CSV, naming every error", async () => {
    const before = await snapshot();

    const result = await run(csv(["ana,Ana,help_desk,,,", "luis@ut.mx,Luis,janitor,,,"]));

    expect(result).toEqual({
      status: "invalid",
      errors: [
        { line: 2, message: "El correo no tiene un formato válido" },
        { line: 3, message: 'El rol "janitor" no existe' },
      ],
    });
    expect(await snapshot()).toEqual(before);
  });

  it("refuses a valid row in a list that has an invalid one", async () => {
    const before = await snapshot();

    const result = await run(csv(["ok@ut.mx,Ok,help_desk,,,", "mal,Mal,help_desk,,,"]));

    expect(result.status).toBe("invalid");
    expect(await getPrisma().account.findUnique({ where: { email: "ok@ut.mx" } })).toBeNull();
    expect(await snapshot()).toEqual(before);
  });

  it.each([
    [
      "a stand that is not one of the event",
      "ana@ut.mx,Ana,stand_admin,,101-9,",
      { line: 2, message: "El stand 101-9 no es uno de los stands del evento" },
    ],
    [
      "a stand that already has an administrator",
      "ana@ut.mx,Ana,stand_admin,,103-3,",
      { line: 2, message: "El stand 103-3 ya tiene administrador" },
    ],
    [
      "a stand that already has its 3 staff",
      "ana@ut.mx,Ana,stand_staff,,101-6,",
      { line: 2, message: "El stand 101-6 tiene 3 staff y se agregarían 1 (máximo 3)" },
    ],
    [
      "a KOF desk that already has staff",
      "ana@ut.mx,Ana,kof_staff,,,4",
      { line: 2, message: "La mesa 4 ya tiene staff" },
    ],
  ])("refuses %s before writing anything", async (_name, row, problem) => {
    const before = await snapshot();

    expect(await run(csv([row]))).toEqual({ status: "invalid", errors: [problem] });
    expect(await snapshot()).toEqual(before);
  });

  it("refuses a list that would pass the 18 stands of the event", async () => {
    const before = await snapshot();
    const fillers = await createFillerStands(16);

    try {
      // 2 stands of the list exist; the other 2 would be the 17th and the 19th of 18.
      expect(await run(csv(["ana@ut.mx,Ana,help_desk,,,"]))).toEqual({
        status: "invalid",
        errors: [{ line: null, message: "El evento admite 18 stands: hay 18 y la lista crearía 2 más" }],
      });
      expect(await snapshot()).toEqual({ ...before, stands: before.stands + 16 });
    } finally {
      await getPrisma().stand.deleteMany({ where: { id: { in: fillers } } });
    }
  });
});

describe("a valid list (T7, T9)", () => {
  const readNever = () => {
    throw new Error("La lista no debe leerse en una segunda corrida");
  };

  let result: Awaited<ReturnType<typeof run>>;

  beforeAll(async () => {
    result = await run(
      csv([
        "Lider1@UT.mx,Líder Uno,stand_admin,kof_admin,101-5,",
        "staff1@ut.mx,Staff Uno,stand_staff,,101-5,",
        "lider2@ut.mx,Líder Dos,stand_admin,sysadmin,101-6,",
        "mesa1@ut.mx,Mesa Uno,kof_staff,,,1",
        "mesa2@ut.mx,Mesa Dos,kof_staff,,,2",
        "kof@ut.mx,Kof Admin,kof_admin,,,",
        "existente@ut.mx,Otro Nombre,raffle_admin,,,",
        ",Córdova,stand_admin,,103-3,",
        "staff102@ut.mx,Staff 102,stand_staff,,102-6,",
      ]),
    );
  });

  it("reports what it did: stands created, invitations, the existing email skipped and who has no email", () => {
    expect(result).toEqual({
      status: "done",
      createdStands: 2,
      invited: 7,
      skippedLines: [8],
      omitted: [{ line: 9, name: "Córdova" }],
    });
  });

  it("creates only the stands that are missing and leaves the existing ones as they were", async () => {
    const stands = await getPrisma().stand.findMany({ orderBy: [{ zone: "asc" }, { number: "asc" }] });

    expect(stands.map(({ zone, number, studio, groupCode }) => ({ zone, number, studio, groupCode }))).toEqual([
      { zone: "A", number: 1, studio: 1, groupCode: "199" },
      { zone: "B", number: 3, studio: 1, groupCode: "199" },
      { zone: "C", number: 3, studio: 5, groupCode: "101" },
      { zone: "T", number: 1, studio: 6, groupCode: "102" },
    ]);
    expect(stands.find((stand) => stand.zone === "A")?.id).toBe(fullStandId);
  });

  it("creates each account as an invitation with its role, secondary role, stand and desk", async () => {
    const standOf = async (zone: string, number: number) =>
      (await getPrisma().stand.findUniqueOrThrow({ where: { zone_number: { zone, number } } })).id;

    expect(await readAccounts()).toEqual([
      { email: "kof@ut.mx", role: "kof_admin", secondaryRole: null, standId: null, kofDesk: null },
      {
        email: "lider1@ut.mx",
        role: "stand_admin",
        secondaryRole: "kof_admin",
        standId: await standOf("C", 3),
        kofDesk: null,
      },
      { email: "lider2@ut.mx", role: "stand_admin", secondaryRole: "sysadmin", standId: fullStandId, kofDesk: null },
      { email: "mesa1@ut.mx", role: "kof_staff", secondaryRole: null, standId: null, kofDesk: 1 },
      { email: "mesa2@ut.mx", role: "kof_staff", secondaryRole: null, standId: null, kofDesk: 2 },
      {
        email: "staff102@ut.mx",
        role: "stand_staff",
        secondaryRole: null,
        standId: await standOf("T", 1),
        kofDesk: null,
      },
      {
        email: "staff1@ut.mx",
        role: "stand_staff",
        secondaryRole: null,
        standId: await standOf("C", 3),
        kofDesk: null,
      },
    ]);

    const accounts = await getPrisma().account.findMany({ where: { email: { in: ["kof@ut.mx", "lider1@ut.mx"] } } });

    expect(accounts).toEqual([
      expect.objectContaining({ name: "Kof Admin", status: "invited", password: null, createdById: null }),
      expect.objectContaining({ name: "Líder Uno", status: "invited", password: null, createdById: null }),
    ]);
  });

  it("does not touch the account whose email already existed", async () => {
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: "existente@ut.mx" } })).toMatchObject({
      name: "existente@ut.mx",
      role: "help_desk",
      status: "active",
    });
    expect(await getPrisma().emailOutbox.count({ where: { to: "existente@ut.mx" } })).toBe(0);
  });

  it("invites the email that already has a visitor passport and leaves the passport as it was (RN-02)", async () => {
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: "staff1@ut.mx" } })).toMatchObject({
      role: "stand_staff",
      status: "invited",
    });
    expect(await getPrisma().visitor.findMany({ where: { email: "staff1@ut.mx" } })).toEqual([
      expect.objectContaining({ gamertag: "Neo", email: "Staff1@ut.mx" }),
    ]);
  });

  it("gives each new account its link of 72 hours and queues its email without sending it", async () => {
    const accounts = await getPrisma().account.findMany({ where: { email: { in: INVITED_EMAILS } } });

    expect(accounts).toHaveLength(7);

    const outbox = await getPrisma().emailOutbox.findMany({ where: { kind: "staff_invitation" } });

    expect(outbox.map((email) => email.referenceId).sort()).toEqual(accounts.map((account) => account.id).sort());
    expect(outbox.every((email) => email.sentAt === null && email.attempts === 0)).toBe(true);
    expect(outbox.every((email) => /\/activate\/[\w-]+/.test(email.text))).toBe(true);

    for (const account of accounts) {
      const invitation = await getPrisma().accountInvitation.findFirstOrThrow({ where: { accountId: account.id } });

      expect(invitation.usedAt).toBeNull();
      expect(invitation.expiresAt).toEqual(new Date(NOW.getTime() + INVITATION_TTL_MS));
    }
  });

  it("audits every account and stand without an actor and without email addresses, and marks the run", async () => {
    const entries = await getPrisma().auditLog.findMany({
      where: {
        OR: [
          { action: { startsWith: "account.invite" } },
          { action: { startsWith: "stand." } },
          { action: "staff.bulk_invite" },
        ],
      },
    });

    const byAction = (action: string) => entries.filter((entry) => entry.action === action);

    expect(byAction("account.invite")).toHaveLength(7);
    expect(byAction("stand.create")).toHaveLength(2);
    expect(entries.every((entry) => entry.actorId === null)).toBe(true);
    expect(JSON.stringify(entries)).not.toContain("@");

    expect(byAction("staff.bulk_invite")).toEqual([
      expect.objectContaining({
        entityType: "staff_invitations",
        entityId: "bulk",
        detail: { createdStands: 2, invited: 7, skipped: 1, omitted: 1 },
      }),
    ]);
  });

  it("does nothing when it runs again, even with a different list, and does not read the list (T9)", async () => {
    const before = await snapshot();

    expect(await runReading(readNever)).toEqual({ status: "alreadyDone" });
    expect(await run(csv(["nuevo@ut.mx,Nuevo,help_desk,,,"]))).toEqual({ status: "alreadyDone" });
    expect(await getPrisma().account.findUnique({ where: { email: "nuevo@ut.mx" } })).toBeNull();
    expect(await snapshot()).toEqual(before);
  });

  it.each([
    ["lider1@ut.mx", "a stand administrator with a secondary role"],
    ["mesa2@ut.mx", "a KOF staff member with a desk"],
  ])("lets the sysadmin resend the invitation of %s, which has a new link (T9)", async (email) => {
    const account = await getPrisma().account.findUniqueOrThrow({ where: { email } });
    const oldToken = await readLastToken(email);

    expect(await getInvitationState(oldToken, NOW)).toEqual({ status: "valid", name: account.name });
    expect(await resendInvitation(sysadmin, account.id, NOW)).toEqual({ status: "sent", emailId: expect.any(String) });

    const newToken = await readLastToken(email);

    expect(newToken).not.toBe(oldToken);
    expect(await getInvitationState(oldToken, NOW)).toEqual({ status: "invalid" });
    expect(await getInvitationState(newToken, NOW)).toEqual({ status: "valid", name: account.name });
    expect(await getPrisma().emailOutbox.count({ where: { to: email } })).toBe(2);
    expect(await getPrisma().accountInvitation.count({ where: { accountId: account.id } })).toBe(1);
  });
});

function run(text: string) {
  return runReading(() => text);
}

function runReading(readCsv: () => string) {
  return inviteStaffFromCsv({ readCsv, stands: STANDS, now: NOW });
}

function csv(rows: string[]): string {
  return [HEADER, ...rows].join("\n") + "\n";
}

async function snapshot() {
  const prisma = getPrisma();

  return {
    accounts: await prisma.account.count(),
    stands: await prisma.stand.count(),
    invitations: await prisma.accountInvitation.count(),
    emails: await prisma.emailOutbox.count(),
    audit: await prisma.auditLog.count(),
  };
}

async function readAccounts() {
  const rows = await getPrisma().account.findMany({
    where: { email: { in: INVITED_EMAILS } },
    orderBy: { email: "asc" },
    select: { email: true, role: true, secondaryRole: true, standId: true, kofDesk: true },
  });

  return rows;
}

async function readLastToken(email: string): Promise<string> {
  const emails = await getPrisma().emailOutbox.findMany({ where: { to: email }, orderBy: { createdAt: "asc" } });
  const match = /\/activate\/([\w-]+)/.exec(emails[emails.length - 1].text);

  if (!match) throw new Error("The email has no activation link");

  return match[1];
}

async function createFillerStands(count: number): Promise<string[]> {
  const ids: string[] = [];

  for (let number = 1; number <= count; number += 1) {
    ids.push(await createStand({ zone: "D", number, studio: 1, groupCode: "199" }));
  }

  return ids;
}

async function createStand(data: { zone: string; number: number; studio: number; groupCode: string }) {
  return (await getPrisma().stand.create({ data })).id;
}

async function createAccount(data: {
  email: string;
  role: string;
  standId?: string;
  kofDesk?: number;
  status?: string;
  password?: string;
}): Promise<string> {
  const account = await getPrisma().account.create({
    data: { name: data.email, status: "invited", ...data },
  });

  return account.id;
}
