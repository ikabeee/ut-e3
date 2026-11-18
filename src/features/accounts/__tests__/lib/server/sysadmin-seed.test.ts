/**
 * @jest-environment node
 */
import { seedSysadmin } from "@features/accounts/lib/server/sysadmin-seed";
import { verifyPassword } from "@shared/lib/server/password";
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const SYSADMIN_ENV = {
  SYSADMIN_EMAIL: " Admin@UT.mx ",
  SYSADMIN_NAME: "Coordinación E3",
  SYSADMIN_PASSWORD: "correct horse battery staple",
};

const database = createTestDatabase();

const prisma = createTestClient(database);

const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  await prisma.account.deleteMany();
  log.mockClear();
});

describe("seedSysadmin", () => {
  it("creates one active sysadmin with a lowercase email and a scrypt password", async () => {
    await seedSysadmin(prisma, SYSADMIN_ENV);

    const accounts = await prisma.account.findMany();

    expect(accounts).toEqual([
      expect.objectContaining({ email: "admin@ut.mx", name: "Coordinación E3", role: "sysadmin", status: "active" }),
    ]);
    expect(await verifyPassword("correct horse battery staple", accounts[0].password ?? "")).toBe(true);
  });

  it("leaves the sysadmin of SYSADMIN_EMAIL and its password as they are on a second run", async () => {
    await seedSysadmin(prisma, SYSADMIN_ENV);
    const [before] = await prisma.account.findMany();

    await seedSysadmin(prisma, { ...SYSADMIN_ENV, SYSADMIN_NAME: "Otro nombre", SYSADMIN_PASSWORD: "otra" });

    expect(await prisma.account.findMany()).toEqual([before]);
    expect(await verifyPassword("correct horse battery staple", before.password ?? "")).toBe(true);
  });

  it("creates the sysadmin of SYSADMIN_EMAIL when another sysadmin already exists, and leaves that one as it is", async () => {
    await seedSysadmin(prisma, { ...SYSADMIN_ENV, SYSADMIN_EMAIL: "primero@ut.mx" });
    const [first] = await prisma.account.findMany();

    await seedSysadmin(prisma, SYSADMIN_ENV);

    const accounts = await prisma.account.findMany({ orderBy: { email: "asc" } });

    expect(accounts).toEqual([
      expect.objectContaining({ email: "admin@ut.mx", role: "sysadmin", status: "active" }),
      first,
    ]);
    expect(await verifyPassword("correct horse battery staple", accounts[0].password ?? "")).toBe(true);
  });

  it("skips the account and says why when the email already belongs to another account", async () => {
    await prisma.account.create({
      data: { email: "admin@ut.mx", name: "Atención", role: "help_desk", status: "invited" },
    });

    await seedSysadmin(prisma, SYSADMIN_ENV);

    expect(await prisma.account.findMany({ select: { role: true } })).toEqual([{ role: "help_desk" }]);
    expect(log).toHaveBeenCalledWith(
      "Seed: no se creó la cuenta del sysadmin porque SYSADMIN_EMAIL ya pertenece a otra cuenta.",
    );
  });

  it.each(["SYSADMIN_EMAIL", "SYSADMIN_NAME", "SYSADMIN_PASSWORD"])(
    "skips the account and says why when %s is missing",
    async (name) => {
      await seedSysadmin(prisma, { ...SYSADMIN_ENV, [name]: " " });

      expect(await prisma.account.count()).toBe(0);
      expect(log).toHaveBeenCalledWith(
        "Seed: no se creó la cuenta del sysadmin porque faltan SYSADMIN_EMAIL, SYSADMIN_NAME o SYSADMIN_PASSWORD.",
      );
    },
  );
});
