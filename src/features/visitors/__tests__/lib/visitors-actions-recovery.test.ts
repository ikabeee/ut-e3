/**
 * @jest-environment node
 */
import { claimRecoveryLink, requestRecoveryEmail } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { CLAIM_PATH } from "@features/visitors/lib/visitors-links";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { VISITOR_DEVICE_COOKIE, isActiveDeviceToken } from "@shared/lib/server/visitor-device";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { stubAfter, type TaskCallback } from "@shared/__tests__/lib/server/headers-stub";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let jar = createCookieJar();

let afterTasks: TaskCallback[] = [];

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  afterTasks = stubAfter().callbacks;
  // No SMTP in the tests: delivery fails and logs, and the queued email stays in the outbox, where the test reads it.
  delete process.env.SMTP_HOST;
  jest.spyOn(console, "error").mockImplementation(() => {});
  await getPrisma().recoveryToken.deleteMany();
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().rateLimit.deleteMany();
  await getPrisma().visitor.create({
    data: {
      fullName: "Ana Pérez",
      gamertag: "Neo_01",
      email: "neo@example.com",
      pin: encryptPin("12345"),
      pinLookup: hashPinForLookup("12345"),
    },
  });
});

describe("requestRecoveryEmail Server Action", () => {
  it("answers the same for a registered email, an unknown one and one over the limit (UT-VI-09, UT-VI-10)", async () => {
    const registered = await requestRecoveryEmail(null, form({ email: " NEO@example.com " }));
    const unknown = await requestRecoveryEmail(null, form({ email: "nadie@example.com" }));

    for (let request = 0; request < 3; request++) await requestRecoveryEmail(null, form({ email: "neo@example.com" }));

    const overLimit = await requestRecoveryEmail(null, form({ email: "neo@example.com" }));

    expect(registered).toEqual({ status: "sent" });
    expect(unknown).toEqual(registered);
    expect(overLimit).toEqual(registered);
  });

  it("does nothing before answering: the lookup and the email run after the response", async () => {
    await requestRecoveryEmail(null, form({ email: "neo@example.com" }));

    expect(await getPrisma().emailOutbox.count()).toBe(0);
    expect(await getPrisma().rateLimit.count()).toBe(0);

    await runAfterTasks();

    expect(await getPrisma().emailOutbox.count()).toBe(1);
  });

  it("queues no email for an unknown address", async () => {
    await requestRecoveryEmail(null, form({ email: "nadie@example.com" }));
    await runAfterTasks();

    expect(await getPrisma().emailOutbox.count()).toBe(0);
  });

  it("rejects an invalid email with its field error and keeps what was typed", async () => {
    const state = await requestRecoveryEmail(null, form({ email: "no-es-correo" }));

    expect(state).toEqual({ status: "invalid", email: "no-es-correo", error: VISITORS_COPY.errors.emailInvalid });
    expect(afterTasks).toHaveLength(0);
  });
});

describe("claimRecoveryLink Server Action", () => {
  it("leaves the device cookie on this phone and goes to the passport", async () => {
    const token = await requestLink();

    await expect(claimRecoveryLink(form({ token }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/passport;"),
    });

    const cookie = jar.get(VISITOR_DEVICE_COOKIE)?.value ?? "";

    expect(await isActiveDeviceToken(cookie)).toBe(true);
  });

  it("sends a used link to the expired-link page without a cookie", async () => {
    const token = await requestLink();

    await expect(claimRecoveryLink(form({ token }))).rejects.toBeDefined();
    jar = createCookieJar();
    stubCookies(jar);

    await expect(claimRecoveryLink(form({ token }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/passport/recover/expired;"),
    });
    expect(jar.get(VISITOR_DEVICE_COOKIE)).toBeUndefined();
  });
});

async function requestLink(): Promise<string> {
  await requestRecoveryEmail(null, form({ email: "neo@example.com" }));
  await runAfterTasks();

  const { text } = await getPrisma().emailOutbox.findFirstOrThrow();

  return new RegExp(`${CLAIM_PATH}/(\\S+)`).exec(text)?.[1] ?? "";
}

async function runAfterTasks(): Promise<void> {
  for (const task of afterTasks.splice(0)) await task();
}

function form(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [name, value] of Object.entries(values)) data.set(name, value);

  return data;
}
