/**
 * @jest-environment node
 */
import { getFraudAlerts } from "@features/moderation/lib/server/moderation-queries";
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
    expect(alerts.fewStandVisitorTotal).toBe(12);
    expect(alerts.fewStandVisitors.map((visitor) => visitor.gamertag)).not.toContain("Constante");

    const checkIn = await getPrisma().checkIn.findFirstOrThrow({ where: { visitorId: visitors[0].id } });

    await annulCheckIn({ actorId: sysadmin.id, targetId: checkIn.id, reason: "Voto inflado", now: BEFORE_RAFFLE });

    await expect(getFraudAlerts()).resolves.toMatchObject({ bursts: [], fewStandVisitorTotal: 11 });
  });
});
