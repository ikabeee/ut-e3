/**
 * @jest-environment node
 */
import {
  readEmailText,
  rebuildEmail,
  resendEmail,
  resendFailedEmails,
  runDeliveryPass,
} from "@features/admin/lib/server/email-mutations";
import {
  auditActions,
  createAbandoned,
  createEmail,
  createFailed,
  findEmail,
  NOW,
} from "@features/admin/__tests__/lib/server/emails-test-utils";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let actorId = "";

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
  actorId = (
    await getPrisma().account.create({
      data: {
        email: `sys-${crypto.randomUUID()}@ut.mx`,
        name: "Sysadmin",
        role: "sysadmin",
        status: "active",
        password: "hash",
      },
    })
  ).id;
});

describe("resendEmail", () => {
  it("puts a failed email with a body back in the queue and audits it", async () => {
    const failed = await createFailed({ text: "Tu PIN es 12345" });

    await expect(resendEmail(actorId, failed.id, NOW)).resolves.toBe(true);

    await expect(findEmail(failed.id)).resolves.toMatchObject({
      attempts: 0,
      nextAttemptAt: NOW,
      text: "Tu PIN es 12345",
    });
    await expect(auditActions(actorId)).resolves.toEqual(["admin.email.resend"]);
  });

  it("also resends a pending email that still waits for its next attempt", async () => {
    const pending = await createEmail({ attempts: 3 });

    await expect(resendEmail(actorId, pending.id, NOW)).resolves.toBe(true);
    await expect(findEmail(pending.id)).resolves.toMatchObject({ attempts: 0, nextAttemptAt: NOW });
  });

  it.each([
    ["a sent email", () => createEmail({ sentAt: NOW, text: "" })],
    ["an abandoned email without a body", () => createAbandoned()],
    ["an id that does not exist", async () => ({ id: "no-existe" })],
  ])("refuses %s and leaves the data and the audit log unchanged", async (_name, build) => {
    const target = await build();
    const before = await getPrisma().emailOutbox.findMany();

    await expect(resendEmail(actorId, target.id, NOW)).resolves.toBe(false);

    await expect(getPrisma().emailOutbox.findMany()).resolves.toEqual(before);
    await expect(auditActions(actorId)).resolves.toEqual([]);
  });
});

describe("resendFailedEmails", () => {
  it("queues every failed email with a body, and only those, after the count was confirmed", async () => {
    const first = await createFailed();
    const second = await createFailed();
    const erased = await createAbandoned();
    const pending = await createEmail({ attempts: 2 });

    await expect(resendFailedEmails(actorId, 2, NOW)).resolves.toEqual({ status: "resent", count: 2 });

    await expect(findEmail(first.id)).resolves.toMatchObject({ attempts: 0, nextAttemptAt: NOW });
    await expect(findEmail(second.id)).resolves.toMatchObject({ attempts: 0, nextAttemptAt: NOW });
    await expect(findEmail(erased.id)).resolves.toMatchObject({ attempts: 5, text: "" });
    await expect(findEmail(pending.id)).resolves.toMatchObject({ attempts: 2 });
    await expect(auditActions(actorId)).resolves.toEqual(["admin.email.resend_failed"]);
    await expect(getPrisma().auditLog.findFirstOrThrow({ where: { actorId } })).resolves.toMatchObject({
      detail: { count: 2 },
    });
  });

  it("writes nothing when the list changed since the sysadmin saw the count", async () => {
    const failed = await createFailed();
    await createFailed();

    await expect(resendFailedEmails(actorId, 1, NOW)).resolves.toEqual({ status: "changed", count: 2 });

    await expect(findEmail(failed.id)).resolves.toMatchObject({ attempts: 5 });
    await expect(auditActions(actorId)).resolves.toEqual([]);
  });
});

describe("readEmailText", () => {
  it("shows the body of an email that has one and audits the reading without the text", async () => {
    const email = await createFailed({ text: "Tu PIN es 12345" });

    await expect(readEmailText(actorId, email.id)).resolves.toBe("Tu PIN es 12345");

    await expect(auditActions(actorId)).resolves.toEqual(["admin.email.view"]);
    await expect(getPrisma().auditLog.findFirstOrThrow({ where: { actorId } })).resolves.toMatchObject({
      entityId: email.id,
      detail: {},
    });
  });

  it("answers null and audits nothing for an erased or unknown email", async () => {
    const erased = await createAbandoned();

    await expect(readEmailText(actorId, erased.id)).resolves.toBeNull();
    await expect(readEmailText(actorId, "no-existe")).resolves.toBeNull();
    await expect(auditActions(actorId)).resolves.toEqual([]);
  });
});

describe("runDeliveryPass", () => {
  it("sends the emails that are due now, skips the ones that wait, and audits how many left", async () => {
    const due = await createEmail({ text: "Hola" });
    const later = await createEmail({ text: "Luego" });
    await getPrisma().emailOutbox.update({
      where: { id: later.id },
      data: { nextAttemptAt: new Date(NOW.getTime() + 60_000) },
    });
    const send = jest.fn().mockResolvedValue(undefined);

    await expect(runDeliveryPass(actorId, send, NOW)).resolves.toBe(1);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ to: due.to, subject: due.subject, text: "Hola" });
    await expect(findEmail(due.id)).resolves.toMatchObject({ sentAt: NOW, text: "" });
    await expect(findEmail(later.id)).resolves.toMatchObject({ sentAt: null });
    await expect(getPrisma().auditLog.findFirstOrThrow({ where: { actorId } })).resolves.toMatchObject({
      action: "admin.email.send_now",
      detail: { sent: 1 },
    });
  });
});

describe("rebuildEmail refusals", () => {
  it.each([
    ["has no kind", { kind: undefined }],
    ["is a login code, which the user asks for again by logging in", { kind: "login_code", referenceId: "x" }],
    ["is an emergency alert", { kind: "emergency" }],
    ["has a kind that is not known", { kind: "otro", referenceId: "x" }],
    ["has no reference", { kind: "visitor_passport" }],
  ])("cannot rebuild an abandoned email that %s, and changes nothing", async (_name, data) => {
    const abandoned = await createAbandoned(data);

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toEqual({ status: "notRebuildable" });

    await expect(getPrisma().emailOutbox.count()).resolves.toBe(1);
    await expect(findEmail(abandoned.id)).resolves.toMatchObject({ attempts: 5, text: "" });
    await expect(auditActions(actorId)).resolves.toEqual([]);
  });

  it.each([
    ["still has its body", () => createFailed({ kind: "visitor_passport", referenceId: "x" })],
    ["was sent", () => createEmail({ kind: "visitor_passport", referenceId: "x", sentAt: NOW, text: "" })],
    [
      "is still being retried",
      () => createEmail({ kind: "visitor_passport", referenceId: "x", text: "", attempts: 2 }),
    ],
    ["does not exist", async () => ({ id: "no-existe" })],
  ])("answers notFound for an email that %s, and changes nothing", async (_name, build) => {
    const target = await build();
    const before = await getPrisma().emailOutbox.findMany();

    await expect(rebuildEmail(actorId, target.id, NOW)).resolves.toEqual({ status: "notFound" });

    await expect(getPrisma().emailOutbox.findMany()).resolves.toEqual(before);
    await expect(auditActions(actorId)).resolves.toEqual([]);
  });

  it("answers sourceGone and keeps the abandoned row when the record it was about no longer exists", async () => {
    const abandoned = await createAbandoned({ kind: "visitor_passport", referenceId: "visitante-borrado" });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toEqual({ status: "sourceGone" });

    await expect(getPrisma().emailOutbox.count()).resolves.toBe(1);
    await expect(findEmail(abandoned.id)).resolves.not.toBeNull();
    await expect(auditActions(actorId)).resolves.toEqual([]);
  });
});
