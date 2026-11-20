/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import type * as NextServer from "next/server";
import { enrollSelfAction } from "@features/tournament/lib/self-entry-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { createEventSettings, createVisitors } from "@features/tournament/__tests__/lib/server/tournament-server-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";
import { VISITOR_DEVICE_COOKIE } from "@shared/lib/server/visitor-device";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const nextServer = jest.requireActual<typeof NextServer>("next/server");

const after = jest.spyOn(nextServer, "after").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const COPY = TOURNAMENT_COPY.ui.entries.selfEntry;

const HOUR = 60 * 60 * 1000;

let visitors: Awaited<ReturnType<typeof createVisitors>> = [];

beforeAll(async () => {
  await createEventSettings();
  visitors = await createVisitors(70);
  await Promise.all(visitors.slice(0, 3).map((visitor, index) => createDevice(visitor.id, `token-${index}`)));
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  refresh.mockClear();
  after.mockClear();
  stubCookies(createCookieJar());
  await setWindows({ opensInHours: -48, onsiteInHours: 2 });
  await getPrisma().tournamentEntry.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().visitor.updateMany({ data: { excludedAt: null, excludedReason: null } });
});

describe("enrollSelfAction", () => {
  it("enrolls the visitor of the passport session, queues the email and refreshes the screen", async () => {
    await useDevice("token-0");

    expect(await enrollSelfAction()).toEqual({ status: "done", message: COPY.enrolled });
    expect(await getPrisma().tournamentEntry.findFirstOrThrow()).toMatchObject({
      visitorId: visitors[0].id,
      channel: "pre",
      registeredById: null,
    });
    expect(await getPrisma().emailOutbox.count()).toBe(1);
    expect(after).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: the second attempt says the visitor is in and creates nothing", async () => {
    await useDevice("token-0");
    await enrollSelfAction();
    after.mockClear();

    expect(await enrollSelfAction()).toEqual({ status: "done", message: COPY.alreadyEnrolled });
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
    expect(await getPrisma().emailOutbox.count()).toBe(1);
    expect(after).not.toHaveBeenCalled();
  });

  it("rejects a request without a passport session", async () => {
    expect(await enrollSelfAction()).toEqual({ status: "error", message: COPY.noPassport });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("rejects a device token that belongs to no passport", async () => {
    await useDevice("unknown-token");

    expect(await enrollSelfAction()).toEqual({ status: "error", message: COPY.noPassport });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("sends the visitor to the KOF area while the on-site sign-up lasts, with no entry or email", async () => {
    await setWindows({ opensInHours: -48, onsiteInHours: -0.5 });
    await useDevice("token-0");

    expect(await enrollSelfAction()).toEqual({ status: "error", message: COPY.closed });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("says the sign-up ended, without inviting to the KOF area, once the on-site sign-up is over (A1)", async () => {
    await setWindows({ opensInHours: -48, onsiteInHours: -2 });
    await useDevice("token-0");

    const state = await enrollSelfAction();

    expect(state).toEqual({ status: "error", message: COPY.ended });
    expect(COPY.ended).not.toMatch(/KOF|Edificio/);
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("rejects before the list opens", async () => {
    await setWindows({ opensInHours: 5, onsiteInHours: 10 });
    await useDevice("token-0");

    expect(await enrollSelfAction()).toEqual({ status: "error", message: expect.stringContaining("abre el") });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
  });

  it("rejects an excluded visitor", async () => {
    await getPrisma().visitor.update({
      where: { id: visitors[0].id },
      data: { excludedAt: new Date(), excludedReason: "Fraude" },
    });
    await useDevice("token-0");

    expect(await enrollSelfAction()).toEqual({ status: "error", message: COPY.excluded });
    expect(await getPrisma().tournamentEntry.count()).toBe(0);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("rejects when the pre-registration list is full", async () => {
    await getPrisma().tournamentEntry.createMany({
      data: visitors.slice(10, 60).map((visitor) => ({ visitorId: visitor.id, channel: "pre", status: "registered" })),
    });
    await useDevice("token-0");

    expect(await enrollSelfAction()).toEqual({ status: "error", message: COPY.full });
    expect(await getPrisma().tournamentEntry.count()).toBe(50);
    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });
});

describe("enrollSelfAction regressions", () => {
  it("ignores a forged visitorId in the form, even on a double submit (P6)", async () => {
    const forged = new FormData();

    forged.append("visitorId", visitors[5].id);
    await useDevice("token-0");

    // Next calls an action with what the browser sent; this one must ignore it.
    const enroll: (...sent: unknown[]) => ReturnType<typeof enrollSelfAction> = enrollSelfAction;

    await enroll(null, forged);
    await enroll(null, forged);

    const entries = await getPrisma().tournamentEntry.findMany();

    expect(entries.map((entry) => entry.visitorId)).toEqual([visitors[0].id]);
    expect(await getPrisma().emailOutbox.count()).toBe(1);
  });

  it("keeps answering past 10 attempts for an enrolled visitor, without duplicates (P7)", async () => {
    await useDevice("token-2");

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await enrollSelfAction()).status).toBe("done");
    }

    expect((await enrollSelfAction()).status).toBe("done");
    expect(await getPrisma().tournamentEntry.count()).toBe(1);
    expect(await getPrisma().emailOutbox.count()).toBe(1);
  });
});

async function setWindows({ opensInHours, onsiteInHours }: { opensInHours: number; onsiteInHours: number }) {
  const now = Date.now();

  await getPrisma().eventSettings.update({
    where: { id: 1 },
    data: {
      kofRegistrationOpensAt: new Date(now + opensInHours * HOUR),
      kofOnsiteSignupStartsAt: new Date(now + onsiteInHours * HOUR),
      kofOnsiteSignupEndsAt: new Date(now + (onsiteInHours + 1) * HOUR),
    },
  });
}

async function createDevice(visitorId: string, token: string) {
  await getPrisma().visitorDevice.create({ data: { visitorId, token: hashToken(token) } });
}

async function useDevice(token: string) {
  const jar = createCookieJar();

  jar.set(VISITOR_DEVICE_COOKIE, token);
  stubCookies(jar);
}
