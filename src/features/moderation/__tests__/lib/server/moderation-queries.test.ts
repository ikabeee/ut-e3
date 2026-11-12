/**
 * @jest-environment node
 */
import {
  getFraudAlerts,
  getStandVisits,
  listModerationStands,
} from "@features/moderation/lib/server/moderation-queries";
import { annulCheckIn } from "@features/moderation/lib/server/moderation-mutations";
import {
  BEFORE_RAFFLE,
  createEventSettings,
  createStands,
  createSysadmin,
  createVisitor,
  visitStands,
} from "@features/moderation/__tests__/lib/server/moderation-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 5).toString("base64");

const AT = new Date("2026-11-20T19:00:00.000Z");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("getFraudAlerts (RF-45)", () => {
  it("uses the thresholds of event_settings and leaves out annulled visits", async () => {
    await createEventSettings();

    const [target, other] = await createStands(2);
    const sysadmin = await createSysadmin();
    const visitors = [];

    for (let index = 0; index < 12; index += 1) {
      const visitor = await createVisitor(`Inflado${index}`, String(30000 + index));

      await visitStands({
        visitorId: visitor.id,
        standIds: [target.id],
        rating: 5,
        at: new Date(AT.getTime() + index * 1000),
      });
      visitors.push(visitor);
    }

    const loyal = await createVisitor("Constante", "39999");

    await visitStands({ visitorId: loyal.id, standIds: [target.id, other.id], rating: 3 });

    const alerts = await getFraudAlerts();

    expect(alerts.thresholds).toEqual({ topScoreCount: 12, windowMinutes: 10, singleVisitMax: 1 });
    expect(alerts.bursts).toEqual([
      expect.objectContaining({ standId: target.id, count: 12, standCode: "ZB-S1-E2-202" }),
    ]);
    expect(alerts.bursts[0].visits).toHaveLength(12);
    expect(alerts.bursts[0].visits[0]).toEqual({
      checkInId: expect.any(String),
      visitorId: visitors[0].id,
      gamertag: "Inflado0",
      maskedEmail: "in***@example.com",
      at: AT.toISOString(),
      ratings: { game: 5, stand: 5, art: 5 },
    });
    expect(JSON.stringify(alerts.bursts)).not.toContain("30000");
    expect(alerts.fewStandVisitorTotal).toBe(12);
    expect(alerts.fewStandVisitors.map((visitor) => visitor.gamertag)).not.toContain("Constante");

    const checkIn = await getPrisma().checkIn.findFirstOrThrow({ where: { visitorId: visitors[0].id } });

    await annulCheckIn({ actorId: sysadmin.id, targetId: checkIn.id, reason: "Voto inflado", now: BEFORE_RAFFLE });

    await expect(getFraudAlerts()).resolves.toMatchObject({ bursts: [], fewStandVisitorTotal: 11 });
  });
});

describe("the view by stand (RF-45)", () => {
  async function createStand(number: number) {
    return getPrisma().stand.create({ data: { zone: "C", number, studio: 2, groupCode: "202" } });
  }

  it("lists who visited, who recorded it and what it rated, and never a PIN or an email", async () => {
    const target = await createStand(61);
    const staff = await getPrisma().account.findFirstOrThrow();
    const visitor = await createVisitor("Sospechoso", "41111");

    await visitStands({ visitorId: visitor.id, standIds: [target.id], rating: 5, at: AT });
    await getPrisma().checkIn.updateMany({ where: { visitorId: visitor.id }, data: { scannedById: staff.id } });

    const visits = await getStandVisits(target.id);

    await expect(listModerationStands()).resolves.toContainEqual({ id: target.id, code: "ZC-S61-E2-202" });
    expect(visits).toEqual([
      expect.objectContaining({
        gamertag: "Sospechoso",
        recordedBy: staff.name,
        ratings: { game: 5, stand: 5, art: 5 },
        status: "valid",
      }),
    ]);
    expect(JSON.stringify(visits)).not.toContain("41111");
    expect(JSON.stringify(visits)).not.toContain("sospechoso@example.com");
  });

  it("marks annulled visits and visits of excluded visitors", async () => {
    const target = await createStand(62);
    const staff = await getPrisma().account.findFirstOrThrow();
    const annulled = await createVisitor("Anulado", "42222");
    const excluded = await createVisitor("Excluido", "43333");

    await visitStands({ visitorId: annulled.id, standIds: [target.id], at: AT });
    await visitStands({ visitorId: excluded.id, standIds: [target.id], at: AT });

    const checkIn = await getPrisma().checkIn.findFirstOrThrow({ where: { visitorId: annulled.id } });

    await annulCheckIn({ actorId: staff.id, targetId: checkIn.id, reason: "Voto inflado", now: BEFORE_RAFFLE });
    await getPrisma().visitor.update({
      where: { id: excluded.id },
      data: { excludedAt: AT, excludedReason: "Trampa" },
    });

    const statuses = Object.fromEntries((await getStandVisits(target.id)).map((v) => [v.gamertag, v.status]));

    expect(statuses).toEqual({ Anulado: "annulled", Excluido: "excluded" });
  });
});
