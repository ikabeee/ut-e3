/**
 * @jest-environment node
 */
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  consoleError.mockClear();
  await getPrisma().emailOutbox.deleteMany();
});

describe("deliverQueuedEmail", () => {
  it("never throws when the mail server is not configured, and leaves the email in the outbox to retry", async () => {
    const queued = await getPrisma().emailOutbox.create({ data: { to: "ana@ut.mx", subject: "Hola", text: "Texto" } });

    await expect(deliverQueuedEmail(queued.id)).resolves.toBeUndefined();

    const row = await getPrisma().emailOutbox.findUniqueOrThrow({ where: { id: queued.id } });

    expect(row.sentAt).toBeNull();
    expect(row.text).toBe("Texto");
  });

  it("logs the message of the failure without the address of the person", async () => {
    const queued = await getPrisma().emailOutbox.create({ data: { to: "ana@ut.mx", subject: "Hola", text: "Texto" } });

    await deliverQueuedEmail(queued.id);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(String(consoleError.mock.calls[0][0])).not.toContain("ana@ut.mx");
  });
});
