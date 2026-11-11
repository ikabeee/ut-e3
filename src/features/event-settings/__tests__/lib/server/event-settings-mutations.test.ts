/**
 * @jest-environment node
 */
import { updateEventSettings } from "@features/event-settings/lib/server/event-settings-mutations";
import { getEditableEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { seedEventSettings } from "@features/event-settings/lib/server/event-settings-seed";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let sysadminId = "";

beforeAll(async () => {
  sysadminId = (
    await getPrisma().account.create({
      data: {
        email: "sysadmin@example.test",
        name: "Coordinación",
        role: "sysadmin",
        status: "active",
        password: "hash",
      },
    })
  ).id;
});

beforeEach(async () => {
  await getPrisma().eventSettings.deleteMany();
  await seedEventSettings(getPrisma());
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("updateEventSettings (RF-43)", () => {
  it("saves a valid change of the hour of the raffle and records only that field (UT-ES-02)", async () => {
    const current = await getEditableEventSettings();

    await expect(
      updateEventSettings(sysadminId, { ...current, raffleStartsAt: "2026-11-20T23:15:00.000Z" }),
    ).resolves.toEqual({ status: "saved" });

    const saved = await getEditableEventSettings();
    const audit = await getPrisma().auditLog.findFirstOrThrow({ where: { action: "event_settings.update" } });

    expect(saved.raffleStartsAt).toBe("2026-11-20T23:15:00.000Z");
    expect(audit).toMatchObject({
      actorId: sysadminId,
      detail: { raffleStartsAt: { before: "2026-11-20T23:00:00.000Z", after: "2026-11-20T23:15:00.000Z" } },
    });
  });

  it("answers unchanged without an audit entry when nothing changed", async () => {
    await expect(updateEventSettings(sysadminId, await getEditableEventSettings())).resolves.toEqual({
      status: "unchanged",
    });
  });

  it("is refused by the CHECKs and keeps the row when a threshold is 0 or the cutoff passes the raffle", async () => {
    const current = await getEditableEventSettings();

    await expect(updateEventSettings(sysadminId, { ...current, fraudWindowMinutes: 0 })).resolves.toEqual({
      status: "rejected",
    });
    await expect(
      updateEventSettings(sysadminId, { ...current, checkInCutoffAt: "2026-11-20T23:30:00.000Z" }),
    ).resolves.toEqual({ status: "rejected" });
    await expect(getEditableEventSettings()).resolves.toEqual(current);
  });

  it("answers missingRow when the seed did not run", async () => {
    const current = await getEditableEventSettings();

    await getPrisma().eventSettings.deleteMany();

    await expect(updateEventSettings(sysadminId, current)).resolves.toEqual({ status: "missingRow" });
  });
});
