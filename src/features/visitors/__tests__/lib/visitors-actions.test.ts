/**
 * @jest-environment node
 */
import { registerVisitor } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { getPrisma } from "@shared/lib/server/prisma";
import { VISITOR_DEVICE_COOKIE } from "@shared/lib/server/visitor-device";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter, stubHeaders } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

let jar = createCookieJar();

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = TEST_KEY;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  stubHeaders({ "x-forwarded-for": "203.0.113.1" });
  stubAfter();
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().emailBlocklist.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();

  // Ensure registration is open by default:
  await getPrisma().eventSettings.upsert({
    where: { id: 1 },
    update: { registrationOpensAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    create: {
      id: 1,
      eventStartsAt: new Date("2026-11-20T17:00:00.000Z"),
      eventEndsAt: new Date("2026-11-20T23:30:00.000Z"),
      registrationOpensAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
});

describe("registerVisitor Server Action", () => {
  it("rejects input with field errors and preserves typed values", async () => {
    const form = createForm({
      fullName: "No",
      gamertag: "bad tag!",
      email: "invalid-email",
    });

    const state = await registerVisitor(null, form);

    expect(state.fieldErrors).toBeDefined();
    expect(state.fieldErrors?.fullName).toBeTruthy();
    expect(state.fieldErrors?.gamertag).toBeTruthy();
    expect(state.fieldErrors?.email).toBeTruthy();
    expect(state.values?.fullName).toBe("No");
    expect(state.values?.gamertag).toBe("bad tag!");
  });

  it("rejects registration when registrationOpensAt is in the future", async () => {
    await getPrisma().eventSettings.update({
      where: { id: 1 },
      data: { registrationOpensAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    const form = createForm({
      fullName: "Thomas Anderson",
      gamertag: "Neo",
      email: "neo@matrix.org",
    });

    const state = await registerVisitor(null, form);

    expect(state.error).toBeTruthy();
    expect(await getPrisma().visitor.count()).toBe(0);
  });

  it("blocks the fourth attempt from the same client IP within an hour", async () => {
    stubHeaders({ "x-forwarded-for": "198.51.100.42, 10.0.0.1" });

    for (let index = 1; index <= 3; index++) {
      const form = createForm({
        fullName: `User ${index}`,
        gamertag: `Gamer${index}`,
        email: `user${index}@ut.mx`,
      });

      await expect(registerVisitor(null, form)).rejects.toMatchObject({
        digest: expect.stringContaining(";/passport;"),
      });
    }

    const fourthForm = createForm({
      fullName: "Fourth User",
      gamertag: "Gamer4",
      email: "user4@ut.mx",
    });

    const fourthState = await registerVisitor(null, fourthForm);

    expect(fourthState.error).toBeTruthy();
  });

  it("returns exactly the generic rejection message when email is blocked", async () => {
    await getPrisma().emailBlocklist.create({
      data: { email: "blocked@ut.mx" },
    });

    const form = createForm({
      fullName: "Blocked User",
      gamertag: "ValidGamer",
      email: "blocked@ut.mx",
    });

    const state = await registerVisitor(null, form);

    expect(state.error).toBe(VISITORS_COPY.genericRejection);
    expect(state.error).toBe("No se pudo registrar este correo");
    expect(state.values?.gamertag).toBe("ValidGamer");
    expect(await getPrisma().visitor.count()).toBe(0);
  });

  it("returns a field error on gamertag when gamertag is taken and preserves form values", async () => {
    const firstForm = createForm({
      fullName: "First Visitor",
      gamertag: "Neo",
      email: "first@ut.mx",
    });

    await expect(registerVisitor(null, firstForm)).rejects.toMatchObject({
      digest: expect.stringContaining(";/passport;"),
    });

    const secondForm = createForm({
      fullName: "Second Visitor",
      gamertag: "neo",
      email: "second@ut.mx",
    });

    const state = await registerVisitor(null, secondForm);

    expect(state.fieldErrors?.gamertag).toBeTruthy();
    expect(state.values?.gamertag).toBe("neo");
    expect(state.values?.email).toBe("second@ut.mx");
  });

  it("successfully registers visitor, sets device cookie, schedules after callback, and redirects to /passport", async () => {
    const afterStub = stubAfter();

    const form = createForm({
      fullName: "Thomas Anderson",
      gamertag: "TheOne",
      email: "theone@matrix.org",
    });

    await expect(registerVisitor(null, form)).rejects.toMatchObject({
      digest: expect.stringContaining(";/passport;"),
    });

    expect(jar.get(VISITOR_DEVICE_COOKIE)?.value).toBeTruthy();
    expect(afterStub.callbacks.length).toBeGreaterThanOrEqual(1);

    await expect(afterStub.callbacks[0]()).resolves.not.toThrow();

    afterStub.restore();
  });
});

function createForm(entries: Record<string, string>): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    form.append(key, value);
  }

  return form;
}
