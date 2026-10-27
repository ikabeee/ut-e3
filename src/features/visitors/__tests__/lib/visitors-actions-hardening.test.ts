/**
 * @jest-environment node
 */
import { registerVisitor } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter, stubHeaders } from "@shared/__tests__/lib/server/headers-stub";
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

let jar = createCookieJar();

const database = createTestDatabase();

const prisma = createTestClient(database);

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = TEST_KEY;

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  stubHeaders({ "x-forwarded-for": "203.0.113.50" });
  stubAfter();
  await prisma.visitorDevice.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.emailBlocklist.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.rateLimit.deleteMany();

  await prisma.eventSettings.upsert({
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

describe("registerVisitor hardening", () => {
  it("asserts the closed error equals VISITORS_COPY.errors.closed exactly", async () => {
    await prisma.eventSettings.update({
      where: { id: 1 },
      data: { registrationOpensAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    const form = createForm({
      fullName: "Thomas Anderson",
      gamertag: "Neo",
      email: "neo@matrix.org",
    });

    const state = await registerVisitor(null, form);

    expect(state.error).toBe(VISITORS_COPY.errors.closed);
    expect(state.error).toBe("El registro de visitantes aún no está abierto.");
    expect(await prisma.visitor.count()).toBe(0);
  });

  it("does not spend rate-limit quota when registration is closed and allows submission when open", async () => {
    stubHeaders({ "x-forwarded-for": "198.51.100.77" });

    await prisma.eventSettings.update({
      where: { id: 1 },
      data: { registrationOpensAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    for (let index = 1; index <= 3; index++) {
      const form = createForm({
        fullName: `Early User ${index}`,
        gamertag: `EarlyGamer${index}`,
        email: `early${index}@ut.mx`,
      });

      const state = await registerVisitor(null, form);

      expect(state.error).toBe(VISITORS_COPY.errors.closed);
    }

    await prisma.eventSettings.update({
      where: { id: 1 },
      data: { registrationOpensAt: new Date(Date.now() - 60 * 1000) },
    });

    const openForm = createForm({
      fullName: "Prompt User",
      gamertag: "PromptGamer",
      email: "prompt@ut.mx",
    });

    await expect(registerVisitor(null, openForm)).rejects.toMatchObject({
      digest: expect.stringContaining(";/passport;"),
    });

    expect(await prisma.visitor.count()).toBe(1);
  });
});

function createForm(entries: Record<string, string>): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    form.append(key, value);
  }

  return form;
}
