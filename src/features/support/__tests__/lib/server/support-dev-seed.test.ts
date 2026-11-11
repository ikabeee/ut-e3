/**
 * @jest-environment node
 */
import {
  SUPPORT_DEV_DEFAULT_PASSWORD,
  SUPPORT_DEV_HELP_DESK_EMAIL,
  seedSupportDev,
} from "@features/support/lib/server/support-dev-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { verifyPassword } from "@shared/lib/server/password";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const OVERRIDE = "otra-clave";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

beforeEach(async () => {
  await getPrisma().account.deleteMany();
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("seedSupportDev", () => {
  it("refuses to run in production", async () => {
    await expect(seedSupportDev({ NODE_ENV: "production" })).rejects.toThrow("producción");
  });

  it("creates the active help desk account with the example password", async () => {
    expect(await seedSupportDev({})).toEqual([SUPPORT_DEV_HELP_DESK_EMAIL]);

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: SUPPORT_DEV_HELP_DESK_EMAIL } });

    expect(account).toMatchObject({ role: "help_desk", status: "active" });
    expect(await verifyPassword(SUPPORT_DEV_DEFAULT_PASSWORD, account.password ?? "")).toBe(true);
  });

  it("uses SUPPORT_DEV_PASSWORD when it is set, and only adds what is missing", async () => {
    await seedSupportDev({ SUPPORT_DEV_PASSWORD: OVERRIDE });

    expect(await seedSupportDev({})).toEqual([]);

    const account = await getPrisma().account.findUniqueOrThrow({ where: { email: SUPPORT_DEV_HELP_DESK_EMAIL } });

    expect(await verifyPassword(OVERRIDE, account.password ?? "")).toBe(true);
  });
});
