/**
 * @jest-environment node
 */
import { checkOverload } from "@features/admin/lib/server/overload-watch";
import { getServerStatus } from "@features/admin/lib/server/server-status";
import { setPublicBracketEnabled } from "@features/tournament/lib/server/public-bracket-mutations";
import { getPrisma } from "@shared/lib/server/prisma";
import { clearLoadSamples, getLoadSamples, recordLoadSample, takeLoadSample } from "@shared/lib/server/system-load";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(() => {
  clearLoadSamples();
});

function overloadedSampler(values: { cpu: number; memory: number }) {
  return (now: number) => {
    const sample = { at: now, ...values };

    recordLoadSample(sample);

    return sample;
  };
}

describe("checkOverload (RF-74)", () => {
  it("closes once the memory stayed above 50% for 2 minutes, then starts the history over", async () => {
    const closes: string[] = [];

    const close = async (reason: string) => {
      closes.push(reason);

      return true;
    };

    const sample = overloadedSampler({ cpu: 0.1, memory: 0.55 });

    for (let at = 0; at < 120_000; at += 10_000) {
      await expect(checkOverload(at, { sample, close })).resolves.toBeNull();
    }

    await expect(checkOverload(120_000, { sample, close })).resolves.toBe("memory");
    expect(closes).toEqual(["overload:memory"]);
    expect(getLoadSamples()).toEqual([]);
    await expect(checkOverload(130_000, { sample, close })).resolves.toBeNull();
  });

  it("does nothing with the CPU at 55% for 90 seconds", async () => {
    const close = jest.fn(async () => true);
    const sample = overloadedSampler({ cpu: 0.55, memory: 0.1 });

    for (let at = 0; at <= 90_000; at += 10_000) await checkOverload(at, { sample, close });

    expect(close).not.toHaveBeenCalled();
  });

  it("reads memory and CPU as shares from 0 to 1", () => {
    const sample = takeLoadSample(2000);

    expect(sample.cpu).toBeGreaterThanOrEqual(0);
    expect(sample.cpu).toBeLessThanOrEqual(1);
    expect(sample.memory).toBeGreaterThan(0);
    expect(sample.memory).toBeLessThanOrEqual(1);
  });
});

describe("the automatic close in the database (UT-AD-09)", () => {
  it("sets publicBracketEnabled to false with an audit entry without actor", async () => {
    await getPrisma().eventSettings.create({
      data: {
        id: 1,
        eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
        eventEndsAt: new Date("2026-11-20T23:30:00.000Z"),
        registrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
        kofRegistrationOpensAt: new Date("2026-11-13T05:00:00.000Z"),
        kofCheckInStartsAt: new Date("2026-11-20T17:00:00.000Z"),
        kofCheckInEndsAt: new Date("2026-11-20T17:45:00.000Z"),
        kofOnsiteSignupStartsAt: new Date("2026-11-20T17:00:00.000Z"),
        kofOnsiteSignupEndsAt: new Date("2026-11-20T17:45:00.000Z"),
        kofBracketGeneratesAt: new Date("2026-11-20T17:55:00.000Z"),
        marketplaceClosesAt: new Date("2026-11-11T04:59:00.000Z"),
        itchOpensAt: new Date("2026-11-20T21:30:00.000Z"),
        checkInCutoffAt: new Date("2026-11-20T21:50:00.000Z"),
        raffleStartsAt: new Date("2026-11-20T23:00:00.000Z"),
        publicBracketEnabled: true,
      },
    });

    for (let at = 0; at < 120_000; at += 10_000) recordLoadSample({ at, cpu: 0.2, memory: 0.8 });

    // The real close, as the watch of instrumentation.ts does it; a second close changes nothing.
    const close = (reason: string) => setPublicBracketEnabled(null, false, reason);

    await expect(checkOverload(120_000, { sample: overloadedSampler({ cpu: 0.2, memory: 0.8 }), close })).resolves.toBe(
      "memory",
    );
    await expect(close("overload:memory")).resolves.toBe(false);

    const settings = await getPrisma().eventSettings.findUniqueOrThrow({ where: { id: 1 } });
    const audit = await getPrisma().auditLog.findFirstOrThrow({ where: { action: "kof_tournament.public_bracket" } });

    expect(settings.publicBracketEnabled).toBe(false);
    expect(audit).toMatchObject({ actorId: null, detail: { enabled: false, reason: "overload:memory" } });

    const status = await getServerStatus(Date.now());

    expect(status.bracket.publicBracketEnabled).toBe(false);
    expect(status.outbox).toEqual({ sent: 0, pending: 0, failed: 0 });
  });
});
