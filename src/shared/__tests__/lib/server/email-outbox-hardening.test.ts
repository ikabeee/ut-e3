/**
 * @jest-environment node
 */
import {
  deliverEmail,
  isTemporaryEmailError,
  type OutgoingEmail,
  type SendEmail,
} from "@shared/lib/server/email-outbox";
import { createSmtpSender } from "@shared/lib/server/mailer";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import * as nodemailer from "nodemailer";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const SAMPLE_EMAIL: OutgoingEmail = {
  to: "visitor@ut.mx",
  subject: "Tu pasaporte UT Game Showcase",
  text: "PIN: 04217",
};

const NOW = new Date("2026-11-20T15:00:00.000Z");

const COMPLETE_ENV = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "465",
  SMTP_USER: "showcase@ut.mx",
  SMTP_PASSWORD: "secret-password",
  SMTP_FROM: "UT Game Showcase <showcase@ut.mx>",
};

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("email outbox hardening (body clearing and sentAt update handling)", () => {
  it("clears text to empty string after successful delivery", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const send: SendEmail = async () => {};

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toEqual(NOW);
    expect(updated?.text).toBe("");
  });

  it("clears text to empty string when abandoned on permanent failure (550)", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const send = createFailingSender(550, "Recipient address rejected");

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toBeNull();
    expect(updated?.attempts).toBe(5);
    expect(updated?.text).toBe("");
  });

  it("clears text to empty string when abandoned on the 5th temporary failure", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        attempts: 4,
        nextAttemptAt: NOW,
      },
    });

    const send = createFailingSender(421, "Temporary service unavailable");

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toBeNull();
    expect(updated?.attempts).toBe(5);
    expect(updated?.text).toBe("");
  });

  it("preserves text when temporary failure has remaining retries", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        attempts: 0,
        nextAttemptAt: NOW,
      },
    });

    const send = createFailingSender(421, "Temporary service unavailable");

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toBeNull();
    expect(updated?.attempts).toBe(1);
    expect(updated?.text).toBe(SAMPLE_EMAIL.text);
  });

  it("rethrows and logs without address or body when sentAt update throws, without recording delivery failure", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const prisma = getPrisma();
    const realUpdate = prisma.emailOutbox.update.bind(prisma.emailOutbox);
    jest.spyOn(prisma.emailOutbox, "update").mockImplementation((args) => {
      if (args.data && "sentAt" in args.data) {
        throw new Error("Disk full or connection closed");
      }

      return realUpdate(args);
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    let sendCalled = false;

    const send: SendEmail = async () => {
      sendCalled = true;
    };

    await expect(deliverEmail(row.id, send, NOW)).rejects.toThrow("Disk full or connection closed");
    expect(sendCalled).toBe(true);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedMessage = consoleErrorSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(loggedMessage).toContain("Disk full or connection closed");
    expect(loggedMessage).not.toContain(SAMPLE_EMAIL.to);
    expect(loggedMessage).not.toContain(SAMPLE_EMAIL.text);

    const rowAfter = await realUpdate({
      where: { id: row.id },
      data: {},
    });

    expect(rowAfter.attempts).toBe(0);
    expect(rowAfter.lastError).toBeNull();
  });
});

describe("email outbox hardening (lease duration and claim time)", () => {
  it("claims the row with a 10-minute lease starting from current time at claim", async () => {
    const pastDueDate = new Date("2026-01-01T00:00:00.000Z");

    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: pastDueDate,
      },
    });

    let claimedNextAttemptAt: Date | undefined;
    const beforeClaim = Date.now();

    const send: SendEmail = async () => {
      const inFlightRow = await getPrisma().emailOutbox.findUnique({
        where: { id: row.id },
      });

      claimedNextAttemptAt = inFlightRow?.nextAttemptAt;
    };

    await deliverEmail(row.id, send, pastDueDate);
    const afterClaim = Date.now();

    expect(claimedNextAttemptAt).toBeDefined();
    const claimedTimestamp = claimedNextAttemptAt ? claimedNextAttemptAt.getTime() : 0;
    expect(claimedTimestamp).toBeGreaterThanOrEqual(beforeClaim + 10 * 60_000 - 5_000);
    expect(claimedTimestamp).toBeLessThanOrEqual(afterClaim + 10 * 60_000 + 5_000);
  });

  it("does not claim rows whose nextAttemptAt is after now (due-date filter preserved)", async () => {
    const filterDate = new Date("2026-06-01T12:00:00.000Z");

    const futureRow = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: new Date(filterDate.getTime() + 1_000),
      },
    });

    let sendCalled = false;

    const send: SendEmail = async () => {
      sendCalled = true;
    };

    await deliverEmail(futureRow.id, send, filterDate);

    expect(sendCalled).toBe(false);
  });
});

describe("email outbox hardening (SMTP auth failure handling)", () => {
  it("treats SMTP response codes 530 and 535 as temporary errors", () => {
    expect(isTemporaryEmailError({ responseCode: 530 })).toBe(true);
    expect(isTemporaryEmailError({ responseCode: 535 })).toBe(true);
  });

  it("schedules a retry instead of abandoning when SMTP auth fails with 535", async () => {
    const row = await getPrisma().emailOutbox.create({
      data: {
        to: SAMPLE_EMAIL.to,
        subject: SAMPLE_EMAIL.subject,
        text: SAMPLE_EMAIL.text,
        nextAttemptAt: NOW,
      },
    });

    const send = createFailingSender(535, "535 5.7.8 Authentication credentials invalid");

    await deliverEmail(row.id, send, NOW);

    const updated = await getPrisma().emailOutbox.findUnique({
      where: { id: row.id },
    });

    expect(updated?.sentAt).toBeNull();
    expect(updated?.attempts).toBe(1);
    expect(updated?.nextAttemptAt.getTime()).toBeGreaterThan(NOW.getTime());
    expect(updated?.text).toBe(SAMPLE_EMAIL.text);
  });
});

describe("mailer hardening (requireTLS and port validation)", () => {
  it("configures requireTLS: true when SMTP_PORT is not 465 (e.g. 587)", () => {
    const spy = jest.spyOn(nodemailer, "createTransport");

    createSmtpSender({ ...COMPLETE_ENV, SMTP_PORT: "587" });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        requireTLS: true,
      }),
    );
  });

  it("configures secure: true and requireTLS: false when SMTP_PORT is 465", () => {
    const spy = jest.spyOn(nodemailer, "createTransport");

    createSmtpSender({ ...COMPLETE_ENV, SMTP_PORT: "465" });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 465,
        secure: true,
        requireTLS: false,
      }),
    );
  });

  it.each(["0", "65536", "-1", "abc", "587.5", "1e3", "0x10"])(
    "throws a Spanish error naming SMTP_PORT when port is %s",
    (invalidPort) => {
      expect(() => createSmtpSender({ ...COMPLETE_ENV, SMTP_PORT: invalidPort })).toThrow(/SMTP_PORT/);
    },
  );

  it.each(["1", "465", "587", "65535"])("accepts valid port %s without throwing", (validPort) => {
    expect(() => createSmtpSender({ ...COMPLETE_ENV, SMTP_PORT: validPort })).not.toThrow();
  });
});

function createFailingSender(responseCode: number, message: string): SendEmail {
  return async () => {
    const error = new Error(message);
    Object.assign(error, { responseCode });

    throw error;
  };
}
