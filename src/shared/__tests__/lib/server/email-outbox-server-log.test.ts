/**
 * @jest-environment node
 */
import { deliverEmail, enqueueEmail, MAX_ATTEMPTS, type SendEmail } from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

// enqueueEmail schedules the row at the real clock, so delivery must run after it, never at a fixed date.
const NOW = new Date(Date.now() + 60 * 60 * 1000);

const EMAIL = { to: "visitor@ut.mx", subject: "Tu código de acceso", text: "Código: 123456" };

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().serverLog.deleteMany();
});

async function queue(attempts = 0): Promise<string> {
  const id = await getPrisma().$transaction((tx) => enqueueEmail(tx, EMAIL));

  await getPrisma().emailOutbox.update({ where: { id }, data: { attempts } });

  return id;
}

function failingWith(error: Error & { responseCode?: number }): SendEmail {
  return async () => {
    throw error;
  };
}

async function loggedEmailEvents() {
  return getPrisma().serverLog.findMany({ where: { source: "email" } });
}

describe("email delivery in the server logs", () => {
  it("logs a sent email as info with the subject and a masked recipient, never the body or the address", async () => {
    await deliverEmail(await queue(), async () => undefined, NOW);

    const [entry, ...rest] = await loggedEmailEvents();

    expect(rest).toEqual([]);
    expect(entry).toMatchObject({ level: "info", message: "Email sent: other" });
    expect(entry.details).toMatchObject({ to: "v***@ut.mx" });
    expect(JSON.stringify(entry)).not.toContain("visitor@ut.mx");
    expect(JSON.stringify(entry)).not.toContain("123456");
  });

  it("logs the kind of the row, and other when it has none", async () => {
    const id = await queue();

    await getPrisma().emailOutbox.update({ where: { id }, data: { kind: "login_code" } });
    await deliverEmail(id, async () => undefined, NOW);
    await deliverEmail(await queue(), async () => undefined, NOW);

    const entries = await getPrisma().serverLog.findMany({ where: { source: "email" }, orderBy: { message: "asc" } });

    expect(entries.map((entry) => entry.message)).toEqual(["Email sent: login_code", "Email sent: other"]);
  });

  it("logs a failed attempt that will be retried as a warning", async () => {
    const error = Object.assign(new Error("Temporary failure"), { responseCode: 421 });

    await deliverEmail(await queue(), failingWith(error), NOW);

    const [entry] = await loggedEmailEvents();

    expect(entry).toMatchObject({ level: "warn", message: "Email failed: other" });
    expect(entry.details).toMatchObject({ to: "v***@ut.mx", attempts: 1, reason: "Temporary failure" });
  });

  it("logs an abandoned email as an error, both for a permanent failure and for the last attempt", async () => {
    const permanent = Object.assign(new Error("Mailbox unavailable"), { responseCode: 550 });
    const temporary = Object.assign(new Error("Busy"), { responseCode: 421 });

    await deliverEmail(await queue(), failingWith(permanent), NOW);
    await deliverEmail(await queue(MAX_ATTEMPTS - 1), failingWith(temporary), NOW);

    const entries = await loggedEmailEvents();

    expect(entries.map((entry) => [entry.level, entry.message])).toEqual(
      expect.arrayContaining([
        ["error", "Email abandoned: other"],
        ["error", "Email abandoned: other"],
      ]),
    );
    expect(entries).toHaveLength(2);
  });
});
