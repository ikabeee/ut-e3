/**
 * @jest-environment node
 */
import { rebuildAbandonedEmails, UNTYPED } from "@features/admin/lib/server/abandoned-email-rebuild";
import {
  createAbandoned,
  createEmail,
  createFailed,
  NOW,
} from "@features/admin/__tests__/lib/server/emails-test-utils";
import { createEventSettings } from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { CLAIM_PATH } from "@features/visitors/lib/visitors-links";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const REBUILD_ACTION = "admin.email.rebuild";

beforeAll(async () => {
  await createEventSettings();
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
  await getPrisma().tournamentEntry.deleteMany();
  await getPrisma().visitor.deleteMany();
});

describe("rebuildAbandonedEmails", () => {
  it("replaces the abandoned passport, KOF and recovery emails with fresh queued rows, and audits each one", async () => {
    const visitor = await createVisitor("Neo", "12345");
    const entry = await createEntry(visitor.id);
    const passport = await createAbandoned({ kind: "visitor_passport", referenceId: visitor.id });
    const kof = await createAbandoned({ kind: "kof_entry", referenceId: entry.id });
    const recovery = await createAbandoned({ kind: "recovery_link", referenceId: visitor.id });

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result).toEqual({
      rebuilt: { visitor_passport: 1, kof_entry: 1, recovery_link: 1 },
      skipped: {},
      sourceGone: {},
      failed: [],
    });

    const rows = await getPrisma().emailOutbox.findMany();

    expect(rows.map((row) => row.kind).sort()).toEqual(["kof_entry", "recovery_link", "visitor_passport"]);

    for (const row of rows) {
      expect(row).toMatchObject({ attempts: 0, sentAt: null });
      expect(row.text).not.toBe("");
      expect([passport.id, kof.id, recovery.id]).not.toContain(row.id);
    }

    expect(rows.find((row) => row.kind === "visitor_passport")?.text).toContain("12345");
    expect(rows.find((row) => row.kind === "recovery_link")?.text).toContain(CLAIM_PATH);
    await expect(getPrisma().recoveryToken.count({ where: { visitorId: visitor.id, usedAt: null } })).resolves.toBe(1);

    const entries = await getPrisma().auditLog.findMany({ where: { action: REBUILD_ACTION } });

    expect(entries.map((entry) => entry.entityId).sort()).toEqual([passport.id, kof.id, recovery.id].sort());

    for (const audit of entries) {
      expect(audit).toMatchObject({ actorId: null, entityType: "email_outbox" });
      expect(audit.detail).toMatchObject({ source: "script" });
    }
  });

  it("does not send anything: the new rows are due in the queue for the mail worker", async () => {
    const visitor = await createVisitor("Trinity", "54321");

    await createAbandoned({ kind: "visitor_passport", referenceId: visitor.id });
    await rebuildAbandonedEmails(getPrisma(), NOW);

    const row = await getPrisma().emailOutbox.findFirstOrThrow();

    expect(row.sentAt).toBeNull();
    expect(row.attempts).toBe(0);
    expect(row.nextAttemptAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
  });

  it("skips login codes, emergency alerts and rows without kind or reference, and counts them per kind", async () => {
    const loginCode = await createAbandoned({ kind: "login_code", referenceId: "cuenta-1" });
    const emergency = await createAbandoned({ kind: "emergency_alert", referenceId: "aviso-1" });
    const untyped = await createAbandoned();
    const noReference = await createAbandoned({ kind: "visitor_passport" });
    const entriesBefore = await auditCount();

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result).toEqual({
      rebuilt: {},
      skipped: { login_code: 1, emergency_alert: 1, [UNTYPED]: 1, visitor_passport: 1 },
      sourceGone: {},
      failed: [],
    });

    const ids = [loginCode.id, emergency.id, untyped.id, noReference.id];

    await expect(getPrisma().emailOutbox.count({ where: { id: { in: ids }, text: "", attempts: 5 } })).resolves.toBe(4);
    await expect(getPrisma().emailOutbox.count()).resolves.toBe(4);
    await expect(auditCount()).resolves.toBe(entriesBefore);
  });

  it("leaves alone the emails that are not abandoned: sent, pending and failed with a body", async () => {
    const visitor = await createVisitor("Morfeo", "11111");

    await createEmail({ kind: "visitor_passport", referenceId: visitor.id, sentAt: new Date(), text: "" });
    await createEmail({ kind: "visitor_passport", referenceId: visitor.id });
    await createFailed({ kind: "visitor_passport", referenceId: visitor.id, text: "Aún con contenido" });

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result).toEqual({ rebuilt: {}, skipped: {}, sourceGone: {}, failed: [] });
    await expect(getPrisma().emailOutbox.count()).resolves.toBe(3);
  });

  it("reports an abandoned row whose visitor is gone as sourceGone and keeps it", async () => {
    const abandoned = await createAbandoned({ kind: "recovery_link", referenceId: "visitante-borrado" });

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result.sourceGone).toEqual({ recovery_link: 1 });
    expect(result.rebuilt).toEqual({});
    await expect(getPrisma().emailOutbox.findUnique({ where: { id: abandoned.id } })).resolves.not.toBeNull();
  });

  it("is idempotent: a second run finds nothing to rebuild and writes nothing", async () => {
    const visitor = await createVisitor("Cypher", "22222");

    await createAbandoned({ kind: "visitor_passport", referenceId: visitor.id });
    await createAbandoned({ kind: "login_code", referenceId: "cuenta-1" });
    await rebuildAbandonedEmails(getPrisma(), NOW);

    const entriesBefore = await auditCount();
    const rowsBefore = await getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } });

    const second = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(second.rebuilt).toEqual({});
    expect(second.failed).toEqual([]);
    await expect(auditCount()).resolves.toBe(entriesBefore);
    await expect(getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } })).resolves.toEqual(rowsBefore);
  });

  it("does not stop at a row that fails: it reports it, rolls it back and rebuilds the others", async () => {
    const broken = await createVisitor("Broken", "33333", "no-es-un-pin-cifrado");
    const healthy = await createVisitor("Healthy", "44444");

    const failing = await createAbandoned({
      kind: "visitor_passport",
      referenceId: broken.id,
      createdAt: new Date("2026-11-01T00:00:00Z"),
    });

    await createAbandoned({
      kind: "visitor_passport",
      referenceId: healthy.id,
      createdAt: new Date("2026-11-02T00:00:00Z"),
    });

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result.rebuilt).toEqual({ visitor_passport: 1 });
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ emailId: failing.id, kind: "visitor_passport" });
    await expect(getPrisma().emailOutbox.findUnique({ where: { id: failing.id } })).resolves.toMatchObject({
      text: "",
    });
    await expect(
      getPrisma().emailOutbox.count({ where: { referenceId: healthy.id, text: { not: "" } } }),
    ).resolves.toBe(1);
  });
});

async function createVisitor(gamertag: string, pin: string, storedPin = encryptPin(pin)) {
  return getPrisma().visitor.create({
    data: {
      fullName: `Nombre ${gamertag}`,
      gamertag,
      email: `${gamertag.toLowerCase()}@example.com`,
      pin: storedPin,
      pinLookup: hashPinForLookup(`${pin}-${gamertag}`),
    },
  });
}

async function createEntry(visitorId: string) {
  return getPrisma().tournamentEntry.create({ data: { visitorId, channel: "pre", status: "registered" } });
}

function auditCount() {
  return getPrisma().auditLog.count({ where: { action: REBUILD_ACTION } });
}
