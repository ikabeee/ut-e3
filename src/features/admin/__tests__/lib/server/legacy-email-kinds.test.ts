/**
 * @jest-environment node
 */
import { backfillLegacyEmailKinds } from "@features/admin/lib/server/legacy-email-kinds";
import { createAbandoned, createEmail, createFailed } from "@features/admin/__tests__/lib/server/emails-test-utils";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const BACKFILL_ACTION = "admin.email.backfill_kind";

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().visitor.deleteMany();
});

describe("backfillLegacyEmailKinds", () => {
  it("gives the passport email its kind and the visitor found by recipient and gamertag", async () => {
    const visitor = await createVisitor("BlackTower");

    const email = await createAbandoned({
      to: visitor.email,
      subject: "Tu pasaporte UT Game Showcase - BlackTower",
    });

    const result = await backfillLegacyEmailKinds(getPrisma());

    expect(result).toEqual({ updated: 1, untouched: 0 });
    await expect(findEmail(email.id)).resolves.toMatchObject({ kind: "visitor_passport", referenceId: visitor.id });
  });

  it("gives the recovery email its kind and the visitor found by recipient", async () => {
    const visitor = await createVisitor("Hypnos88");
    const email = await createFailed({ to: visitor.email, subject: "Recupera tu pasaporte" });

    await expect(backfillLegacyEmailKinds(getPrisma())).resolves.toEqual({ updated: 1, untouched: 0 });

    await expect(findEmail(email.id)).resolves.toMatchObject({ kind: "recovery_link", referenceId: visitor.id });
  });

  it("finds the visitor when the recipient is written with other letter case", async () => {
    const visitor = await createVisitor("aleeamez");

    const email = await createAbandoned({
      to: visitor.email.toUpperCase(),
      subject: "Tu pasaporte UT Game Showcase - aleeamez",
    });

    await backfillLegacyEmailKinds(getPrisma());

    await expect(findEmail(email.id)).resolves.toMatchObject({ kind: "visitor_passport", referenceId: visitor.id });
  });

  it("leaves untouched the rows that cannot be identified, with their kind and reference still empty", async () => {
    const visitor = await createVisitor("Adrian0_0ae");
    const entriesBefore = await auditCount();
    const unknownSubject = await createAbandoned({ to: visitor.email, subject: "Otro asunto" });

    const unknownRecipient = await createAbandoned({
      to: "nadie@example.com",
      subject: "Recupera tu pasaporte",
    });

    const otherGamertag = await createAbandoned({
      to: visitor.email,
      subject: "Tu pasaporte UT Game Showcase - OtraPersona",
    });

    await expect(backfillLegacyEmailKinds(getPrisma())).resolves.toEqual({ updated: 0, untouched: 3 });

    for (const { id } of [unknownSubject, unknownRecipient, otherGamertag]) {
      await expect(findEmail(id)).resolves.toMatchObject({ kind: null, referenceId: null });
    }

    // The audit log only grows, so the test compares with the entries it found.
    await expect(auditCount()).resolves.toBe(entriesBefore);
  });

  it("does not touch a row that already has a kind, nor an email that was already sent", async () => {
    const visitor = await createVisitor("Neo");

    const typed = await createAbandoned({
      to: visitor.email,
      subject: "Recupera tu pasaporte",
      kind: "staff_invitation",
      referenceId: "cuenta-1",
    });

    const sent = await createEmail({ to: visitor.email, subject: "Recupera tu pasaporte", sentAt: new Date() });

    await expect(backfillLegacyEmailKinds(getPrisma())).resolves.toEqual({ updated: 0, untouched: 0 });

    await expect(findEmail(typed.id)).resolves.toMatchObject({ kind: "staff_invitation", referenceId: "cuenta-1" });
    await expect(findEmail(sent.id)).resolves.toMatchObject({ kind: null, referenceId: null });
  });

  it("keeps the body, attempts, error and dates of the row it updates", async () => {
    const visitor = await createVisitor("Trinity");
    const email = await createFailed({ to: visitor.email, subject: "Recupera tu pasaporte", text: "Enlace" });
    const before = await findEmail(email.id);

    await backfillLegacyEmailKinds(getPrisma());

    const after = await findEmail(email.id);

    expect(after).toMatchObject({
      to: before?.to,
      subject: before?.subject,
      text: "Enlace",
      attempts: before?.attempts,
      lastError: before?.lastError,
      sentAt: null,
    });
    expect(after?.nextAttemptAt).toEqual(before?.nextAttemptAt);
    expect(after?.createdAt).toEqual(before?.createdAt);
  });

  it("records one audit entry per updated row, without an actor", async () => {
    const visitor = await createVisitor("Morpheus");
    const email = await createAbandoned({ to: visitor.email, subject: "Recupera tu pasaporte" });

    await backfillLegacyEmailKinds(getPrisma());

    const entries = await getPrisma().auditLog.findMany({ where: { action: BACKFILL_ACTION, entityId: email.id } });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      actorId: null,
      entityType: "email_outbox",
      detail: { kind: "recovery_link", referenceId: visitor.id },
    });
  });

  it("is idempotent: a second run changes nothing and records nothing", async () => {
    const visitor = await createVisitor("Cypher");

    await createAbandoned({ to: visitor.email, subject: "Recupera tu pasaporte" });
    await createAbandoned({ to: "nadie@example.com", subject: "Recupera tu pasaporte" });

    await backfillLegacyEmailKinds(getPrisma());

    const entriesBefore = await auditCount();
    const rowsBefore = await getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } });

    await expect(backfillLegacyEmailKinds(getPrisma())).resolves.toEqual({ updated: 0, untouched: 1 });

    await expect(auditCount()).resolves.toBe(entriesBefore);
    await expect(getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } })).resolves.toEqual(rowsBefore);
  });
});

async function createVisitor(gamertag: string) {
  return getPrisma().visitor.create({
    data: {
      fullName: `Nombre ${gamertag}`,
      gamertag,
      email: `${gamertag.toLowerCase()}@example.com`,
      pin: encryptPin("12345"),
      pinLookup: hashPinForLookup(`12345-${gamertag}`),
    },
  });
}

function findEmail(id: string) {
  return getPrisma().emailOutbox.findUnique({ where: { id } });
}

function auditCount() {
  return getPrisma().auditLog.count({ where: { action: BACKFILL_ACTION } });
}
