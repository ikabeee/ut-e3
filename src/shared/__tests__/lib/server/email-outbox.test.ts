/**
 * @jest-environment node
 */
import {
  deliverEmail,
  deliverPendingEmails,
  enqueueEmail,
  getRetryDelayMs,
  isTemporaryEmailError,
  type OutgoingEmail,
  type SendEmail,
} from "@shared/lib/server/email-outbox";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const SAMPLE_EMAIL: OutgoingEmail = {
  to: "visitor@ut.mx",
  subject: "Tu pasaporte UT Game Showcase",
  text: "PIN: 04217",
};

const NOW = new Date("2026-11-20T15:00:00.000Z");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
});

describe("enqueueEmail", () => {
  it("creates a pending row inside a committed transaction", async () => {
    let enqueuedId = "";

    await getPrisma().$transaction(async (tx) => {
      enqueuedId = await enqueueEmail(tx, SAMPLE_EMAIL);
    });

    const row = await getPrisma().emailOutbox.findUnique({
      where: { id: enqueuedId },
    });

    expect(row).not.toBeNull();
    expect(row?.to).toBe(SAMPLE_EMAIL.to);
    expect(row?.subject).toBe(SAMPLE_EMAIL.subject);
    expect(row?.text).toBe(SAMPLE_EMAIL.text);
    expect(row?.attempts).toBe(0);
    expect(row?.sentAt).toBeNull();
  });

  it("leaves no row when the transaction is rolled back", async () => {
    await expect(
      getPrisma().$transaction(async (tx) => {
        await enqueueEmail(tx, SAMPLE_EMAIL);

        throw new Error("Rollback");
      }),
    ).rejects.toThrow("Rollback");

    const count = await getPrisma().emailOutbox.count();

    expect(count).toBe(0);
  });
});

describe("deliverEmail", () => {
  it("delivers successfully, calling sender once and marking sentAt", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const delivered: OutgoingEmail[] = [];

    const send: SendEmail = async (email) => {
      delivered.push(email);
    };

    await deliverEmail(row.id, send, NOW);

    expect(delivered).toEqual([SAMPLE_EMAIL]);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toEqual(NOW);
    expect(updated?.attempts).toBe(0);
    expect(updated?.lastError).toBeNull();
  });

  it("handles temporary failure (421) by incrementing attempts, storing lastError, and moving nextAttemptAt forward", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const send: SendEmail = async () => {
      const error = new Error("Temporary service unavailable");
      Object.assign(error, { responseCode: 421 });

      throw error;
    };

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toBeNull();
    expect(updated?.attempts).toBe(1);
    expect(updated?.lastError).toContain("Temporary service unavailable");
    expect(updated?.nextAttemptAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("stops retries by setting attempts to 5 on permanent failure (550)", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const send: SendEmail = async () => {
      const error = new Error("Recipient address rejected");
      Object.assign(error, { responseCode: 550 });

      throw error;
    };

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toBeNull();
    expect(updated?.attempts).toBe(5);
    expect(updated?.lastError).toContain("Recipient address rejected");
  });

  it("treats 550 with 4.7.28 in response as a temporary error and schedules a retry", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const send: SendEmail = async () => {
      const error = new Error("Gmail rate limit");
      Object.assign(error, { responseCode: 550, response: "550-5.7.1 [IP] 4.7.28 Gmail rate limit exceeded" });

      throw error;
    };

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toBeNull();
    expect(updated?.attempts).toBe(1);
    expect(updated?.lastError).toContain("Gmail rate limit");
    expect(updated?.nextAttemptAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("does not deliver if attempts reaches 5, already sent, or nextAttemptAt is in the future", async () => {
    const maxAttemptsRow = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        attempts: 5,
        nextAttemptAt: NOW,
      },
    });

    const alreadySentRow = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        sentAt: NOW,
        nextAttemptAt: NOW,
      },
    });

    const futureRow = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: new Date(NOW.getTime() + 60_000),
      },
    });

    let sendCalled = false;

    const send: SendEmail = async () => {
      sendCalled = true;
    };

    await deliverEmail(maxAttemptsRow.id, send, NOW);
    await deliverEmail(alreadySentRow.id, send, NOW);
    await deliverEmail(futureRow.id, send, NOW);

    expect(sendCalled).toBe(false);
  });
});

describe("deliverPendingEmails", () => {
  it("delivers every pending row due for delivery and returns the count of sent emails", async () => {
    await getPrisma().emailOutbox.create({
      data: {
        to: "first@ut.mx",
        subject: "Subject 1",
        text: "Text 1",
        nextAttemptAt: NOW,
      },
    });

    await getPrisma().emailOutbox.create({
      data: {
        to: "second@ut.mx",
        subject: "Subject 2",
        text: "Text 2",
        nextAttemptAt: NOW,
      },
    });

    await getPrisma().emailOutbox.create({
      data: {
        to: "already-sent@ut.mx",
        subject: "Subject 3",
        text: "Text 3",
        sentAt: NOW,
        nextAttemptAt: NOW,
      },
    });

    await getPrisma().emailOutbox.create({
      data: {
        to: "maxed@ut.mx",
        subject: "Subject 4",
        text: "Text 4",
        attempts: 5,
        nextAttemptAt: NOW,
      },
    });

    await getPrisma().emailOutbox.create({
      data: {
        to: "future@ut.mx",
        subject: "Subject 5",
        text: "Text 5",
        nextAttemptAt: new Date(NOW.getTime() + 60_000),
      },
    });

    const sentEmails: OutgoingEmail[] = [];

    const send: SendEmail = async (email) => {
      sentEmails.push(email);
    };

    const count = await deliverPendingEmails(send, NOW);

    expect(count).toBe(2);
    expect(sentEmails).toHaveLength(2);
  });
});

describe("getRetryDelayMs", () => {
  it("calculates exponential backoff capped at 15 minutes when random returns 1", () => {
    const fixedRandom = () => 1;

    expect(getRetryDelayMs(1, fixedRandom)).toBe(30_000);
    expect(getRetryDelayMs(2, fixedRandom)).toBe(60_000);
    expect(getRetryDelayMs(3, fixedRandom)).toBe(120_000);
    expect(getRetryDelayMs(4, fixedRandom)).toBe(240_000);
    expect(getRetryDelayMs(5, fixedRandom)).toBe(480_000);
    expect(getRetryDelayMs(6, fixedRandom)).toBe(900_000);
    expect(getRetryDelayMs(10, fixedRandom)).toBe(900_000);
  });

  it("returns 0 when random returns 0", () => {
    const zeroRandom = () => 0;

    expect(getRetryDelayMs(1, zeroRandom)).toBe(0);
    expect(getRetryDelayMs(2, zeroRandom)).toBe(0);
  });
});

describe("isTemporaryEmailError", () => {
  it("identifies 4xx SMTP response codes as temporary", () => {
    expect(isTemporaryEmailError({ responseCode: 421 })).toBe(true);
    expect(isTemporaryEmailError({ responseCode: 450 })).toBe(true);
  });

  it("identifies 5xx SMTP response codes as permanent unless containing 4.7.28", () => {
    expect(isTemporaryEmailError({ responseCode: 550 })).toBe(false);
    expect(isTemporaryEmailError({ responseCode: 550, response: "4.7.28 Rate limit exceeded" })).toBe(true);
  });

  it("identifies network or timeout errors without responseCode as temporary", () => {
    expect(isTemporaryEmailError(new Error("Connection reset by peer"))).toBe(true);
    expect(isTemporaryEmailError("Unknown failure")).toBe(true);
  });
});
