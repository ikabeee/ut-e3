/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { actionAsyncStorage } from "next/dist/client/components/server-async-storage";
import { claimRecoveryLink, registerVisitor, requestRecoveryEmail } from "@features/visitors/lib/visitors-actions";
import { CLAIM_PATH } from "@features/visitors/lib/visitors-links";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter, stubHeaders, type TaskCallback } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

let jar = createCookieJar();

let afterTasks: TaskCallback[] = [];

// updateTag only runs inside Next; the spy replaces it on the module object the action reads.
const nextCache = jest.requireActual<typeof NextCache>("next/cache");

jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

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
  stubHeaders({ "x-forwarded-for": "203.0.113.90" });
  afterTasks = stubAfter().callbacks;
  // No SMTP in the tests: delivery fails and logs, and the queued email stays in the outbox, where the test reads it.
  delete process.env.SMTP_HOST;
  jest.spyOn(console, "error").mockImplementation(() => {});
  await getPrisma().recoveryToken.deleteMany();
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();

  // Registration is open by default:
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

// In production Next calls a Server Action with the action store marking `isAction`, and that is what turns the
// default redirect into a history push. The tests run the actions in that same context (like stubCookies and
// stubHeaders do for the request context), so the digest carries the production type instead of the context-free
// default. `redirect()` without an explicit type answers `push` here; only `RedirectType.replace` answers `replace`.
function runAsServerAction<Result>(task: () => Promise<Result>): Promise<Result> {
  return actionAsyncStorage.run({ isAction: true }, task);
}

// S4: after registering, Back leaves the passport instead of returning to it (audit H3-1). The redirect replaces the
// registration in the history instead of pushing the passport on top of it.
describe("registerVisitor redirect type (S4)", () => {
  it("replaces the registration in the history when it goes to the passport", async () => {
    const form = createForm({
      fullName: "Thomas Anderson",
      gamertag: "TheOneS4",
      email: "theones4@matrix.org",
    });

    await expect(runAsServerAction(() => registerVisitor(null, form))).rejects.toMatchObject({
      digest: expect.stringContaining(";replace;/passport;"),
    });
  });
});

// S4: claiming the recovery link also lands on the passport, so it replaces too instead of pushing.
describe("claimRecoveryLink redirect type (S4)", () => {
  it("replaces the confirmation in the history when it goes to the passport", async () => {
    const token = await requestLink();

    await expect(runAsServerAction(() => claimRecoveryLink(createForm({ token })))).rejects.toMatchObject({
      digest: expect.stringContaining(";replace;/passport;"),
    });
  });

  it("still sends a used link to the expired-link page", async () => {
    const token = await requestLink();

    await expect(runAsServerAction(() => claimRecoveryLink(createForm({ token })))).rejects.toBeDefined();
    jar = createCookieJar();
    stubCookies(jar);

    await expect(runAsServerAction(() => claimRecoveryLink(createForm({ token })))).rejects.toMatchObject({
      digest: expect.stringContaining(";/passport/recover/expired;"),
    });
  });
});

async function requestLink(): Promise<string> {
  await getPrisma().visitor.create({
    data: {
      fullName: "Ana Pérez",
      gamertag: "NeoS4",
      email: "neos4@example.com",
      pin: encryptPin("12345"),
      pinLookup: hashPinForLookup("12345"),
    },
  });
  await requestRecoveryEmail(null, createForm({ email: "neos4@example.com" }));
  await runAfterTasks();

  const { text } = await getPrisma().emailOutbox.findFirstOrThrow();

  return new RegExp(`${CLAIM_PATH}/(\\S+)`).exec(text)?.[1] ?? "";
}

async function runAfterTasks(): Promise<void> {
  for (const task of afterTasks.splice(0)) await task();
}

function createForm(entries: Record<string, string>): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    form.append(key, value);
  }

  return form;
}
