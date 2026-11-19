/**
 * @jest-environment node
 */
import {
  createEmergencyAlerter,
  describeRequestError,
  EMERGENCY_ALERT_WINDOW_MS,
  MAX_EMERGENCY_ALERTS_PER_HOUR,
} from "@shared/lib/server/emergency-alert";
import type { OutgoingEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ENV = { EMERGENCY_MAIL: "guardia@example.com" };

const ALERT = { key: "disk", subject: "Disco casi lleno", detail: "Quedan 10 MB en el volumen de la base." };

const START = Date.parse("2026-11-20T18:00:00.000Z");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
});

function createAlerter(env: Record<string, string | undefined>, clock = createClock(START)) {
  const delivered: string[] = [];

  const alert = createEmergencyAlerter({
    env,
    now: clock.now,
    deliver: async (emailId) => {
      delivered.push(emailId);
    },
  });

  return { alert, delivered, clock };
}

function createClock(start: number) {
  let current = start;

  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("createEmergencyAlerter (S20)", () => {
  it("does nothing without EMERGENCY_MAIL: no outbox row and no delivery", async () => {
    const { alert, delivered } = createAlerter({});

    await expect(alert(ALERT)).resolves.toBe(false);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
    expect(delivered).toEqual([]);
  });

  it("does nothing when EMERGENCY_MAIL is only spaces", async () => {
    const { alert } = createAlerter({ EMERGENCY_MAIL: "   " });

    await expect(alert(ALERT)).resolves.toBe(false);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("queues one email to EMERGENCY_MAIL and delivers it right away", async () => {
    const { alert, delivered } = createAlerter(ENV);

    await expect(alert(ALERT)).resolves.toBe(true);

    const row = await getPrisma().emailOutbox.findFirstOrThrow();

    expect(row).toMatchObject({ kind: "emergency", referenceId: null });
    expect(row.to).toBe("guardia@example.com");
    expect(row.subject).toBe("[Emergencia] PIXEL & CODE: Disco casi lleno");
    expect(row.text).toContain("Quedan 10 MB en el volumen de la base.");
    expect(row.text).toContain("2026-11-20T18:00:00.000Z");
    expect(delivered).toEqual([row.id]);
  });

  it("sends the same alert only once inside the window and again once the window passed", async () => {
    const { alert, clock } = createAlerter(ENV);

    await alert(ALERT);
    clock.advance(EMERGENCY_ALERT_WINDOW_MS - 1);

    await expect(alert(ALERT)).resolves.toBe(false);
    expect(await getPrisma().emailOutbox.count()).toBe(1);

    clock.advance(1);

    await expect(alert(ALERT)).resolves.toBe(true);
    expect(await getPrisma().emailOutbox.count()).toBe(2);
  });

  it("sends different alerts inside the window", async () => {
    const { alert } = createAlerter(ENV);

    await alert(ALERT);

    await expect(alert({ ...ALERT, key: "overload:cpu" })).resolves.toBe(true);
    expect(await getPrisma().emailOutbox.count()).toBe(2);
  });

  it("caps a storm of different alerts per hour so it cannot flood the inbox", async () => {
    const { alert, clock } = createAlerter(ENV);

    for (let index = 0; index < MAX_EMERGENCY_ALERTS_PER_HOUR + 5; index += 1) {
      await alert({ ...ALERT, key: `error-${index}` });
    }

    expect(await getPrisma().emailOutbox.count()).toBe(MAX_EMERGENCY_ALERTS_PER_HOUR);

    clock.advance(60 * 60_000);

    await expect(alert({ ...ALERT, key: "after-the-hour" })).resolves.toBe(true);
  });

  it("never throws: when the outbox fails it sends directly, and when that fails too it gives up quietly", async () => {
    const direct: OutgoingEmail[] = [];

    const failingQueue = async (): Promise<string> => {
      throw new Error("SQLITE_FULL");
    };

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const alert = createEmergencyAlerter({
      env: ENV,
      queue: failingQueue,
      sendDirectly: async (email) => {
        direct.push(email);
        throw new Error("SMTP down");
      },
    });

    await expect(alert(ALERT)).resolves.toBe(true);
    expect(direct.map((email) => email.to)).toEqual(["guardia@example.com"]);
    expect(consoleError).toHaveBeenCalledWith("Emergency alert failed: SMTP down");

    consoleError.mockRestore();
  });
});

describe("describeRequestError", () => {
  it("names the route file, not the visited path, so a token in the URL never reaches the email", () => {
    const error = new Error("Cannot read properties of undefined");

    const alert = describeRequestError(
      error,
      { path: "/activate/secret-token?x=1", method: "GET" },
      { routePath: "/activate/[token]", routeType: "render" },
    );

    expect(alert.key).toBe("request:/activate/[token]:Cannot read properties of undefined");
    expect(alert.subject).toBe("Error en GET /activate/[token]");
    expect(alert.detail).toContain("Cannot read properties of undefined");
    expect(alert.detail).not.toContain("secret-token");
  });

  it("reads a thrown value that is not an Error", () => {
    const alert = describeRequestError("boom", { path: "/", method: "POST" }, { routePath: "/", routeType: "action" });

    expect(alert.detail).toContain("boom");
  });
});
