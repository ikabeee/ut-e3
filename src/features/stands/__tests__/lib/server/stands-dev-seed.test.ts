/**
 * @jest-environment node
 */
import {
  STAND_DEV_ADMIN_EMAIL,
  STAND_DEV_DEFAULT_PASSWORD,
  STAND_DEV_NEARLY_THERE_PIN,
  STAND_DEV_VISITOR_COUNT,
  getStandDevStaffEmail,
  seedStandsDev,
} from "@features/stands/lib/server/stands-dev-seed";
import { registerVisit } from "@features/stands/lib/server/visit-mutations";
import { createEventSettings, createStand } from "@features/stands/__tests__/lib/server/stands-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { verifyPassword } from "@shared/lib/server/password";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

// Creating the accounts hashes their passwords, which can pass the default timeout when the machine is busy.
jest.setTimeout(30_000);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const OVERRIDE = "otra-clave";

const BEFORE_REGISTRATION = new Date("2026-11-01T18:00:00.000Z");

const NOW = new Date("2026-11-20T18:00:00.000Z");

beforeEach(async () => {
  await getPrisma().vote.deleteMany();
  await getPrisma().checkIn.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().account.deleteMany();
  await getPrisma().game.deleteMany();
  await getPrisma().stand.deleteMany();
  await getPrisma().eventSettings.deleteMany();
  await createEventSettings();

  for (let number = 1; number <= 10; number += 1) await createStand(number);
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("seedStandsDev", () => {
  it("refuses to run in production", async () => {
    await expect(seedStandsDev({ NODE_ENV: "production" }, NOW)).rejects.toThrow("producción");
  });

  it("leaves the registration hour alone when it is told not to move the hours", async () => {
    const before = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    await seedStandsDev({}, BEFORE_REGISTRATION, { moveHours: false });

    const after = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });

    expect(after.registrationOpensAt).toEqual(before.registrationOpensAt);
    expect(await getPrisma().account.count()).toBe(11);
  });

  it("asks for the sample stands first", async () => {
    await getPrisma().game.deleteMany();

    await expect(seedStandsDev({}, NOW)).rejects.toThrow("db:seed");
  });

  it("creates a staff account per stand, an administrator and the fake passports", async () => {
    const result = await seedStandsDev({}, NOW);

    expect(result).toMatchObject({ createdVisitors: STAND_DEV_VISITOR_COUNT });
    expect(result.createdAccounts).toHaveLength(11);
    expect(result.createdAccounts).toContain(getStandDevStaffEmail("A", 1));
    expect(await getPrisma().visitor.count()).toBe(STAND_DEV_VISITOR_COUNT);
    expect(await getPrisma().account.findUniqueOrThrow({ where: { email: STAND_DEV_ADMIN_EMAIL } })).toMatchObject({
      role: "stand_admin",
      status: "active",
    });
  });

  it("uses the password of the environment when there is one", async () => {
    await seedStandsDev({ STAND_DEV_PASSWORD: OVERRIDE }, NOW);

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: STAND_DEV_ADMIN_EMAIL } });

    expect(await verifyPassword(OVERRIDE, account.password ?? "")).toBe(true);
    expect(await verifyPassword(STAND_DEV_DEFAULT_PASSWORD, account.password ?? "")).toBe(false);
  });

  it("opens the registration of passports when its hour is still ahead", async () => {
    await seedStandsDev({}, BEFORE_REGISTRATION);

    expect((await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } })).registrationOpensAt).toEqual(
      BEFORE_REGISTRATION,
    );
  });

  it("leaves the registration hour alone when it already passed", async () => {
    const before = (await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } })).registrationOpensAt;

    await seedStandsDev({}, new Date("2026-11-21T00:00:00.000Z"));

    expect((await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } })).registrationOpensAt).toEqual(
      before,
    );
  });

  it("only adds what is missing when it runs again", async () => {
    await seedStandsDev({}, NOW);

    expect(await seedStandsDev({}, NOW)).toEqual({ createdAccounts: [], createdVisitors: 0 });
    expect(await getPrisma().checkIn.count()).toBe(8);
  });

  it("leaves the demo passport one visit away from its first ticket", async () => {
    await seedStandsDev({}, NOW);
    const first = await getPrisma().stand.findFirstOrThrow({ where: { zone: "A", number: 1 } });
    const staff = await getPrisma().account.findUniqueOrThrow({ where: { email: getStandDevStaffEmail("A", 1) } });

    const result = await registerVisit(
      {
        standId: first.id,
        scannedById: staff.id,
        pin: STAND_DEV_NEARLY_THERE_PIN,
        ratings: { gameRating: 5, standRating: 5, artRating: 5 },
      },
      NOW,
    );

    expect(result).toEqual({ status: "registered", ticketsGranted: 1 });
  });
});
