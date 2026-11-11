/**
 * @jest-environment node
 */
import {
  getOutboxSummary,
  listUndeliveredEmails,
  maskAddress,
  requeueEmail,
} from "@shared/lib/server/email-outbox-status";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const NOW = new Date("2026-11-20T18:00:00.000Z");

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

async function createEmail(data: { to: string; text: string; attempts?: number; sentAt?: Date }) {
  return getPrisma().emailOutbox.create({ data: { subject: "Asunto", ...data } });
}

describe("the outbox in the server status (RF-73)", () => {
  it("counts sent, pending and failed, and requeues only an unsent email with a body", async () => {
    const sent = await createEmail({ to: "ana@example.com", text: "", sentAt: NOW });
    const pending = await createEmail({ to: "beto@example.com", text: "Hola", attempts: 2 });
    const failedWithBody = await createEmail({ to: "carla@example.com", text: "Hola", attempts: 5 });
    const failedErased = await createEmail({ to: "dani@example.com", text: "", attempts: 5 });

    await expect(getOutboxSummary()).resolves.toEqual({ sent: 1, pending: 1, failed: 2 });

    const listed = await listUndeliveredEmails(10);

    expect(listed.map((email) => [email.id, email.failed, email.canResend])).toEqual([
      [failedWithBody.id, true, true],
      [failedErased.id, true, false],
      [pending.id, false, true],
    ]);
    expect(listed[0].to).toBe("c***@example.com");

    await expect(requeueEmail(failedWithBody.id, NOW)).resolves.toBe(true);
    await expect(requeueEmail(failedErased.id, NOW)).resolves.toBe(false);
    await expect(requeueEmail(sent.id, NOW)).resolves.toBe(false);
    await expect(getOutboxSummary()).resolves.toEqual({ sent: 1, pending: 2, failed: 1 });
    await expect(
      getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: failedWithBody.id } }),
    ).resolves.toMatchObject({
      attempts: 0,
      nextAttemptAt: NOW,
    });
  });

  it("masks an address without @ entirely", () => {
    expect(maskAddress("nadie")).toBe("***");
  });
});
