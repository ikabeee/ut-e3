/**
 * @jest-environment node
 */
import { rebuildAbandonedEmails } from "@features/admin/lib/server/abandoned-email-rebuild";
import {
  createAbandoned,
  createEmail,
  createFailed,
  NOW,
} from "@features/admin/__tests__/lib/server/emails-test-utils";
import { createEventSettings } from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

const REBUILD_ACTION = "admin.email.rebuild";

let counter = 0;

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
  it("rebuilds an abandoned staff invitation and password reset with fresh queued rows, and audits each one", async () => {
    const invited = await createAccount({ status: "invited", password: null });
    const active = await createAccount({ status: "active", password: "hash" });
    const invitation = await createAbandoned({ kind: "staff_invitation", referenceId: invited.id });
    const reset = await createAbandoned({ kind: "password_reset", referenceId: active.id });

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result).toEqual({
      rebuilt: { staff_invitation: 1, password_reset: 1 },
      skipped: {},
      sourceGone: {},
      failed: [],
      planned: [],
    });

    const rows = await getPrisma().emailOutbox.findMany();

    expect(rows.map((row) => row.kind).sort()).toEqual(["password_reset", "staff_invitation"]);

    for (const row of rows) {
      expect(row).toMatchObject({ attempts: 0, sentAt: null });
      expect(row.text).not.toBe("");
      expect([invitation.id, reset.id]).not.toContain(row.id);
      expect(row.nextAttemptAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
    }

    await expect(getPrisma().accountInvitation.count({ where: { accountId: invited.id, usedAt: null } })).resolves.toBe(
      1,
    );
    await expect(getPrisma().passwordResetToken.count({ where: { accountId: active.id, usedAt: null } })).resolves.toBe(
      1,
    );

    const entries = await getPrisma().auditLog.findMany({ where: { action: REBUILD_ACTION } });

    expect(entries.map((entry) => entry.entityId).sort()).toEqual([invitation.id, reset.id].sort());

    for (const audit of entries) {
      expect(audit).toMatchObject({ actorId: null, entityType: "email_outbox" });
      expect(audit.detail).toMatchObject({ source: "script" });
    }
  });

  it("never touches an abandoned visitor email: it stays byte-identical, with no audit, token or count", async () => {
    const visitor = await createVisitor("Neo", "12345");
    const entry = await createEntry(visitor.id);

    await createAbandoned({ kind: "visitor_passport", referenceId: visitor.id });
    await createAbandoned({ kind: "recovery_link", referenceId: visitor.id });
    await createAbandoned({ kind: "kof_entry", referenceId: entry.id });
    await createAbandoned({ kind: "raffle_winner", referenceId: "sorteo-1" });
    await createAbandoned({ kind: "visitor_passport" });

    const before = await getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } });
    const auditBefore = await auditCount();

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result).toEqual({ rebuilt: {}, skipped: {}, sourceGone: {}, failed: [], planned: [] });
    await expect(getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } })).resolves.toEqual(before);
    await expect(auditCount()).resolves.toBe(auditBefore);
    await expect(getPrisma().recoveryToken.count()).resolves.toBe(0);
  });

  it("leaves alone, and does not count, login codes, emergency alerts and rows without a kind", async () => {
    const ids = [
      (await createAbandoned({ kind: "login_code", referenceId: "cuenta-1" })).id,
      (await createAbandoned({ kind: "emergency", referenceId: "aviso-1" })).id,
      (await createAbandoned()).id,
    ];

    const auditBefore = await auditCount();

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result).toEqual({ rebuilt: {}, skipped: {}, sourceGone: {}, failed: [], planned: [] });
    await expect(getPrisma().emailOutbox.count({ where: { id: { in: ids }, text: "", attempts: 5 } })).resolves.toBe(3);
    await expect(auditCount()).resolves.toBe(auditBefore);
  });

  it("does not send anything and leaves alone the staff emails that are not abandoned", async () => {
    const invited = await createAccount({ status: "invited", password: null });

    await createEmail({ kind: "staff_invitation", referenceId: invited.id, sentAt: new Date(), text: "" });
    await createEmail({ kind: "staff_invitation", referenceId: invited.id });
    await createFailed({ kind: "password_reset", referenceId: invited.id, text: "Aún con contenido" });

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result).toEqual({ rebuilt: {}, skipped: {}, sourceGone: {}, failed: [], planned: [] });
    await expect(getPrisma().emailOutbox.count()).resolves.toBe(3);
  });

  it("skips an abandoned staff email without a reference and reports one whose account changed as sourceGone", async () => {
    const activated = await createAccount({ status: "active", password: "hash" });
    const noReference = await createAbandoned({ kind: "staff_invitation" });
    const gone = await createAbandoned({ kind: "staff_invitation", referenceId: activated.id });
    const missing = await createAbandoned({ kind: "password_reset", referenceId: "cuenta-borrada" });
    const auditBefore = await auditCount();

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(result.skipped).toEqual({ staff_invitation: 1 });
    expect(result.sourceGone).toEqual({ staff_invitation: 1, password_reset: 1 });
    expect(result.rebuilt).toEqual({});

    for (const row of [noReference, gone, missing]) {
      await expect(getPrisma().emailOutbox.findUnique({ where: { id: row.id } })).resolves.toEqual(row);
    }

    await expect(auditCount()).resolves.toBe(auditBefore);
  });

  it("dry run lists the staff emails it would rebuild, without recipient or tokens, and writes nothing", async () => {
    const invited = await createAccount({ status: "invited", password: null });
    const visitor = await createVisitor("Trinity", "54321");

    const invitation = await createAbandoned({
      kind: "staff_invitation",
      referenceId: invited.id,
      createdAt: new Date("2026-11-01T00:00:00Z"),
    });

    await createAbandoned({ kind: "visitor_passport", referenceId: visitor.id });
    await createAbandoned({ kind: "staff_invitation" });

    const before = await getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } });
    const auditBefore = await auditCount();

    const result = await rebuildAbandonedEmails(getPrisma(), NOW, { dryRun: true });

    expect(result).toEqual({
      rebuilt: {},
      skipped: { staff_invitation: 1 },
      sourceGone: {},
      failed: [],
      planned: [{ emailId: invitation.id, kind: "staff_invitation", createdAt: new Date("2026-11-01T00:00:00Z") }],
    });
    expect(JSON.stringify(result)).not.toContain(invited.email);
    await expect(getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } })).resolves.toEqual(before);
    await expect(auditCount()).resolves.toBe(auditBefore);
    await expect(getPrisma().accountInvitation.count({ where: { accountId: invited.id } })).resolves.toBe(0);
  });

  it("is idempotent: a second run finds nothing to rebuild and writes nothing", async () => {
    const invited = await createAccount({ status: "invited", password: null });

    await createAbandoned({ kind: "staff_invitation", referenceId: invited.id });
    await createAbandoned({ kind: "login_code", referenceId: "cuenta-1" });
    await rebuildAbandonedEmails(getPrisma(), NOW);

    const auditBefore = await auditCount();
    const rowsBefore = await getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } });

    const second = await rebuildAbandonedEmails(getPrisma(), NOW);

    expect(second).toEqual({ rebuilt: {}, skipped: {}, sourceGone: {}, failed: [], planned: [] });
    await expect(auditCount()).resolves.toBe(auditBefore);
    await expect(getPrisma().emailOutbox.findMany({ orderBy: { id: "asc" } })).resolves.toEqual(rowsBefore);
  });

  it("does not stop at a row that fails: it reports it, rolls it back and rebuilds the others", async () => {
    const healthy = await createAccount({ status: "invited", password: null });
    const broken = await createAccount({ status: "invited", password: null });

    const failing = await createAbandoned({
      kind: "staff_invitation",
      referenceId: broken.id,
      createdAt: new Date("2026-11-01T00:00:00Z"),
    });

    await createAbandoned({
      kind: "staff_invitation",
      referenceId: healthy.id,
      createdAt: new Date("2026-11-02T00:00:00Z"),
    });
    await getPrisma().$executeRawUnsafe(
      `CREATE TRIGGER fail_for_test BEFORE INSERT ON email_outbox WHEN NEW.reference_id = '${broken.id}' BEGIN SELECT RAISE(ABORT, 'boom'); END`,
    );

    const result = await rebuildAbandonedEmails(getPrisma(), NOW);

    await getPrisma().$executeRawUnsafe("DROP TRIGGER fail_for_test");

    expect(result.rebuilt).toEqual({ staff_invitation: 1 });
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ emailId: failing.id, kind: "staff_invitation" });
    await expect(getPrisma().accountInvitation.count({ where: { accountId: broken.id } })).resolves.toBe(0);
    await expect(getPrisma().emailOutbox.findUnique({ where: { id: failing.id } })).resolves.toMatchObject({
      text: "",
    });
  });
});

async function createAccount(data: { status: string; password: string | null }) {
  counter += 1;

  return getPrisma().account.create({
    data: { email: `cuenta${counter}@ut.mx`, name: `Cuenta ${counter}`, role: "help_desk", ...data },
  });
}

async function createVisitor(gamertag: string, pin: string) {
  return getPrisma().visitor.create({
    data: {
      fullName: `Nombre ${gamertag}`,
      gamertag,
      email: `${gamertag.toLowerCase()}@example.com`,
      pin: encryptPin(pin),
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
