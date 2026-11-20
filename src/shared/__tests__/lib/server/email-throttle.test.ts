/**
 * @jest-environment node
 */
import {
  deliverEmail,
  deliverPendingEmails,
  getRetryDelayMs,
  isTemporaryEmailError,
  MAX_ATTEMPTS,
  MAX_BATCH_SIZE,
  type SendEmail,
} from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-20T15:00:00.000Z");

const MINUTE_MS = 60_000;

const HOUR_MS = 60 * MINUTE_MS;

// What nodemailer throws when Gmail closes the connection at the EHLO (smtp-connection, _actionEHLO).
const GMAIL_GREETING_REFUSAL = Object.assign(
  new Error("Server terminates connection. response=421-4.7.0 Try again later, closing connection. (EHLO): gsmtp"),
  {
    code: "ECONNECTION",
    command: "EHLO",
    responseCode: 421,
    response: "421-4.7.0 Try again later, closing connection. (EHLO)",
  },
);

// What nodemailer throws when Google Workspace's relay refuses the DATA command over its daily quota.
const GOOGLE_DAILY_RELAY_LIMIT = Object.assign(
  new Error(
    "Data command failed: 550-5.7.1 Daily SMTP relay limit exceeded for user relay@ut.mx. For more information on\n" +
      "550 5.7.1 this limit, go to https://support.google.com/a/answer/166852 - gsmtp",
  ),
  {
    code: "EENVELOPE",
    command: "DATA",
    responseCode: 550,
    response:
      "550-5.7.1 Daily SMTP relay limit exceeded for user relay@ut.mx. For more information on\n" +
      "550 5.7.1 this limit, go to https://support.google.com/a/answer/166852 - gsmtp",
  },
);

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
});

describe("getRetryDelayMs", () => {
  it("waits from 15 minutes up to 2 hours between attempts, with the full wait when random returns 1", () => {
    const fullWait = () => 1;

    expect(getRetryDelayMs(1, fullWait)).toBe(15 * MINUTE_MS);
    expect(getRetryDelayMs(2, fullWait)).toBe(30 * MINUTE_MS);
    expect(getRetryDelayMs(3, fullWait)).toBe(HOUR_MS);
    expect(getRetryDelayMs(4, fullWait)).toBe(2 * HOUR_MS);
    expect(getRetryDelayMs(8, fullWait)).toBe(2 * HOUR_MS);
  });

  it("never waits less than half of the schedule, so the jitter cannot bring the retries back to minutes", () => {
    const shortestWait = () => 0;

    expect(getRetryDelayMs(1, shortestWait)).toBe(7.5 * MINUTE_MS);
    expect(getRetryDelayMs(4, shortestWait)).toBe(HOUR_MS);
  });

  it("spreads the retries of an email over at least 1.5 hours even with the shortest waits", () => {
    const shortestWait = () => 0;
    const attempts = Array.from({ length: MAX_ATTEMPTS - 1 }, (_, index) => index + 1);
    const total = attempts.reduce((sum, attempt) => sum + getRetryDelayMs(attempt, shortestWait), 0);

    expect(total).toBeGreaterThanOrEqual(1.5 * HOUR_MS);
  });
});

describe("isTemporaryEmailError with the greeting refusal of Gmail", () => {
  it("classifies 421 4.7.0 closing the connection at the EHLO as temporary", () => {
    expect(isTemporaryEmailError(GMAIL_GREETING_REFUSAL)).toBe(true);
  });

  it("keeps a permanent 5xx answer permanent", () => {
    expect(isTemporaryEmailError({ responseCode: 550, response: "550-5.1.1 The email account does not exist" })).toBe(
      false,
    );
  });
});

describe("isTemporaryEmailError with a provider quota answer", () => {
  it("classifies Google's 550 5.7.1 Daily SMTP relay limit exceeded as temporary", () => {
    expect(isTemporaryEmailError(GOOGLE_DAILY_RELAY_LIMIT)).toBe(true);
  });

  it("reads the limit from the message when the error carries no response text", () => {
    expect(
      isTemporaryEmailError(
        Object.assign(new Error("Data command failed: 550-5.7.1 Daily SMTP relay limit exceeded for user x"), {
          responseCode: 550,
        }),
      ),
    ).toBe(true);
  });

  it.each([
    "550 5.4.5 Daily sending quota exceeded",
    "554 5.7.1 Rate limit reached, try again later",
    "452 4.5.3 Too many recipients",
  ])("classifies %j as temporary", (response) => {
    expect(isTemporaryEmailError({ responseCode: Number(response.slice(0, 3)), response })).toBe(true);
  });

  it.each([
    "550-5.1.1 The email account that you tried to reach does not exist",
    "554 5.7.1 Message rejected due to local policy",
    "552 5.2.2 The recipient mailbox is over quota",
  ])("keeps %j permanent", (response) => {
    expect(isTemporaryEmailError({ responseCode: Number(response.slice(0, 3)), response })).toBe(false);
  });
});

describe("deliverEmail after a provider quota answer", () => {
  it("keeps the body, counts the attempt and schedules the next one instead of abandoning the email", async () => {
    const row = await createDueEmail("quota@ut.mx");

    await deliverEmail(row.id, failingSender(GOOGLE_DAILY_RELAY_LIMIT), NOW);

    const updated = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: row.id } });

    expect(updated.attempts).toBe(1);
    expect(updated.text).toBe("Texto");
    expect(updated.sentAt).toBeNull();
    expect(updated.lastError).toContain("Daily SMTP relay limit exceeded");
    expect(updated.nextAttemptAt.getTime() - NOW.getTime()).toBeGreaterThanOrEqual(7.5 * MINUTE_MS);
    expect(updated.nextAttemptAt.getTime() - NOW.getTime()).toBeLessThanOrEqual(15 * MINUTE_MS);
  });

  it("stops the pass at the first quota answer so the other emails do not spend an attempt", async () => {
    await createDueEmail("a@ut.mx", new Date(NOW.getTime() - 3000));
    await createDueEmail("b@ut.mx", new Date(NOW.getTime() - 2000));
    await createDueEmail("c@ut.mx", new Date(NOW.getTime() - 1000));

    let calls = 0;

    const send: SendEmail = async () => {
      calls++;

      throw GOOGLE_DAILY_RELAY_LIMIT;
    };

    await expect(deliverPendingEmails(send, NOW)).resolves.toBe(0);

    expect(calls).toBe(1);

    const rows = await getPrisma().emailOutbox.findMany({ orderBy: { createdAt: "asc" } });

    expect(rows.map((row) => row.attempts)).toEqual([1, 0, 0]);
    expect(rows.map((row) => row.text)).toEqual(["Texto", "Texto", "Texto"]);
  });

  it("still abandons a plain 550 user unknown at once and erases the body", async () => {
    const row = await createDueEmail("unknown@ut.mx");

    const rejection = Object.assign(new Error("550-5.1.1 The email account that you tried to reach does not exist"), {
      responseCode: 550,
      response: "550-5.1.1 The email account that you tried to reach does not exist",
    });

    await deliverEmail(row.id, failingSender(rejection), NOW);

    const updated = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: row.id } });

    expect(updated.attempts).toBe(MAX_ATTEMPTS);
    expect(updated.text).toBe("");
  });
});

describe("deliverEmail after the Gmail 421", () => {
  it("keeps the body and waits at least 7.5 minutes for the second attempt instead of retrying within the minute", async () => {
    const row = await createDueEmail("first@ut.mx");

    await deliverEmail(row.id, failingSender(GMAIL_GREETING_REFUSAL), NOW);

    const updated = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: row.id } });

    expect(updated.attempts).toBe(1);
    expect(updated.text).toBe("Texto");
    expect(updated.lastError).toContain("421-4.7.0");
    expect(updated.nextAttemptAt.getTime() - NOW.getTime()).toBeGreaterThanOrEqual(7.5 * MINUTE_MS);
    expect(updated.nextAttemptAt.getTime() - NOW.getTime()).toBeLessThanOrEqual(15 * MINUTE_MS);
  });

  it("uses the fifth and last attempt only hours after the first one", async () => {
    const row = await createDueEmail("slow@ut.mx");
    let attemptAt = NOW;

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      await deliverEmail(row.id, failingSender(GMAIL_GREETING_REFUSAL), attemptAt);

      const updated = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: row.id } });

      expect(updated.attempts).toBe(attempt);
      attemptAt = updated.nextAttemptAt;
    }

    expect(attemptAt.getTime() - NOW.getTime()).toBeGreaterThanOrEqual(1.5 * HOUR_MS);
  });

  it("still abandons at once on a permanent 550 and erases the body", async () => {
    const row = await createDueEmail("gone@ut.mx");
    const rejection = Object.assign(new Error("550 5.1.1 No such user"), { responseCode: 550 });

    await deliverEmail(row.id, failingSender(rejection), NOW);

    const updated = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: row.id } });

    expect(updated.attempts).toBe(MAX_ATTEMPTS);
    expect(updated.text).toBe("");
  });
});

describe("deliverPendingEmails batch", () => {
  it("sends at most MAX_BATCH_SIZE emails per pass, the oldest first, and leaves the rest for the next pass", async () => {
    const extra = 3;

    for (let index = 0; index < MAX_BATCH_SIZE + extra; index++) {
      await createDueEmail(`person${index}@ut.mx`, new Date(NOW.getTime() - (MAX_BATCH_SIZE + extra - index) * 1000));
    }

    const recipients: string[] = [];

    const send: SendEmail = async ({ to }) => {
      recipients.push(to);
    };

    await expect(deliverPendingEmails(send, NOW)).resolves.toBe(MAX_BATCH_SIZE);

    expect(recipients).toHaveLength(MAX_BATCH_SIZE);
    expect(recipients[0]).toBe("person0@ut.mx");
    await expect(getPrisma().emailOutbox.count({ where: { sentAt: null } })).resolves.toBe(extra);
  });

  it("stops the pass at the first temporary failure so the other emails do not spend an attempt", async () => {
    await createDueEmail("a@ut.mx", new Date(NOW.getTime() - 3000));
    await createDueEmail("b@ut.mx", new Date(NOW.getTime() - 2000));
    await createDueEmail("c@ut.mx", new Date(NOW.getTime() - 1000));

    let calls = 0;

    const send: SendEmail = async () => {
      calls++;

      throw GMAIL_GREETING_REFUSAL;
    };

    await expect(deliverPendingEmails(send, NOW)).resolves.toBe(0);

    expect(calls).toBe(1);

    const rows = await getPrisma().emailOutbox.findMany({ orderBy: { createdAt: "asc" } });

    expect(rows.map((row) => row.attempts)).toEqual([1, 0, 0]);
    expect(rows[1].nextAttemptAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
  });

  it("goes on with the next email after a permanent failure of one recipient", async () => {
    await createDueEmail("bad@ut.mx", new Date(NOW.getTime() - 2000));
    await createDueEmail("good@ut.mx", new Date(NOW.getTime() - 1000));

    const send: SendEmail = async ({ to }) => {
      if (to === "bad@ut.mx") throw Object.assign(new Error("550 No such user"), { responseCode: 550 });
    };

    await expect(deliverPendingEmails(send, NOW)).resolves.toBe(1);

    const good = await getPrisma().emailOutbox.findFirstOrThrow({ where: { to: "good@ut.mx" } });

    expect(good.sentAt).not.toBeNull();
  });
});

function createDueEmail(to: string, createdAt: Date = NOW) {
  return getPrisma().emailOutbox.create({
    data: { to, subject: "Asunto", text: "Texto", nextAttemptAt: createdAt, createdAt },
  });
}

function failingSender(error: Error): SendEmail {
  return async () => {
    throw error;
  };
}
