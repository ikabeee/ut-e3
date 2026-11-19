/**
 * @jest-environment node
 */
import { rebuildEmail } from "@features/admin/lib/server/email-mutations";
import { auditActions, createAbandoned, findEmail, NOW } from "@features/admin/__tests__/lib/server/emails-test-utils";
import { decideDraw, spinRaffle } from "@features/raffle/lib/server/raffle-mutations";
import {
  createEventSettings,
  createRaffleAdmin,
  createVisitorWithTickets,
  DURING_RAFFLE,
} from "@features/raffle/__tests__/lib/server/raffle-server-utils";
import { CLAIM_PATH } from "@features/visitors/lib/visitors-links";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let actorId = "";

beforeAll(async () => {
  await createEventSettings();
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().emailOutbox.deleteMany();
  actorId = (await createRaffleAdmin("Sysadmin")).id;
});

// What a rebuild leaves: the abandoned row gone, one new queued email of the same kind and reference, and one audit entry.
async function expectReplaced(abandonedId: string, kind: string, referenceId: string) {
  const rows = await getPrisma().emailOutbox.findMany();

  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ kind, referenceId, attempts: 0, sentAt: null });
  expect(rows[0].id).not.toBe(abandonedId);
  expect(rows[0].text).not.toBe("");
  await expect(findEmail(abandonedId)).resolves.toBeNull();
  await expect(auditActions(actorId)).resolves.toContain("admin.email.rebuild");

  return rows[0];
}

describe("rebuildEmail per kind", () => {
  it("visitor_passport: writes the passport email again with the PIN decrypted from the visitor", async () => {
    const visitor = await createVisitor("Neo", "12345");
    const abandoned = await createAbandoned({ kind: "visitor_passport", referenceId: visitor.id });

    const result = await rebuildEmail(actorId, abandoned.id, NOW);

    expect(result).toMatchObject({ status: "rebuilt" });

    const row = await expectReplaced(abandoned.id, "visitor_passport", visitor.id);

    expect(row.to).toBe("neo@example.com");
    expect(row.text).toContain("12345");
    expect(row.text).toContain("Neo");
  });

  it("recovery_link: issues a new recovery link through the existing function", async () => {
    const visitor = await createVisitor("Trinity", "54321");
    const abandoned = await createAbandoned({ kind: "recovery_link", referenceId: visitor.id });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toMatchObject({ status: "rebuilt" });

    const row = await expectReplaced(abandoned.id, "recovery_link", visitor.id);

    expect(row.text).toContain(CLAIM_PATH);
    await expect(getPrisma().recoveryToken.count({ where: { visitorId: visitor.id, usedAt: null } })).resolves.toBe(1);
  });

  it("kof_entry: writes the confirmation of the entry again", async () => {
    const visitor = await createVisitor("Morfeo", "11111");
    const entry = await createEntry(visitor.id);
    const abandoned = await createAbandoned({ kind: "kof_entry", referenceId: entry.id });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toMatchObject({ status: "rebuilt" });

    const row = await expectReplaced(abandoned.id, "kof_entry", entry.id);

    expect(row.to).toBe("morfeo@example.com");
    expect(row.text).toContain("Morfeo");
  });

  it("staff_invitation: issues a new invitation for an account that is still invited", async () => {
    const account = await createAccount({ status: "invited", password: null });
    const abandoned = await createAbandoned({ kind: "staff_invitation", referenceId: account.id });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toMatchObject({ status: "rebuilt" });

    const row = await expectReplaced(abandoned.id, "staff_invitation", account.id);

    expect(row.to).toBe(account.email);
    await expect(getPrisma().accountInvitation.count({ where: { accountId: account.id, usedAt: null } })).resolves.toBe(
      1,
    );
  });

  it("staff_invitation: does nothing for an account that already activated", async () => {
    const account = await createAccount({ status: "active", password: "hash" });
    const abandoned = await createAbandoned({ kind: "staff_invitation", referenceId: account.id });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toEqual({ status: "sourceGone" });

    await expect(getPrisma().emailOutbox.count()).resolves.toBe(1);
    await expect(getPrisma().accountInvitation.count({ where: { accountId: account.id } })).resolves.toBe(0);
  });

  it("password_reset: issues a new reset link for an active account", async () => {
    const account = await createAccount({ status: "active", password: "hash" });
    const abandoned = await createAbandoned({ kind: "password_reset", referenceId: account.id });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toMatchObject({ status: "rebuilt" });

    await expectReplaced(abandoned.id, "password_reset", account.id);
    await expect(
      getPrisma().passwordResetToken.count({ where: { accountId: account.id, usedAt: null } }),
    ).resolves.toBe(1);
  });

  it("password_reset: does nothing for a disabled account", async () => {
    const account = await createAccount({ status: "disabled", password: "hash" });
    const abandoned = await createAbandoned({ kind: "password_reset", referenceId: account.id });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toEqual({ status: "sourceGone" });

    await expect(getPrisma().passwordResetToken.count({ where: { accountId: account.id } })).resolves.toBe(0);
    await expect(auditActions(actorId)).resolves.toEqual([]);
  });

  it("raffle_winner: writes the winner email again, and does nothing for a discarded draw", async () => {
    const visitor = await createVisitorWithTickets("Cifra");
    const spun = await spinRaffle({ actorId, requestId: crypto.randomUUID(), now: DURING_RAFFLE, randomInt: () => 0 });

    expect(spun.status).toBe("drawn");

    const drawId = spun.status === "drawn" ? spun.draw.id : "";

    const abandoned = await createAbandoned({ kind: "raffle_winner", referenceId: drawId });

    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toEqual({ status: "sourceGone" });

    await decideDraw({ actorId, drawId, outcome: "winner", now: DURING_RAFFLE });
    await getPrisma().emailOutbox.deleteMany({ where: { id: { not: abandoned.id } } });
    await expect(rebuildEmail(actorId, abandoned.id, NOW)).resolves.toMatchObject({ status: "rebuilt" });

    const row = await expectReplaced(abandoned.id, "raffle_winner", drawId);

    expect(row.to).toBe(visitor.email);
    expect(row.text).toContain("Cifra");
  });
});

let counter = 0;

async function createVisitor(gamertag: string, pin: string) {
  return getPrisma().visitor.create({
    data: {
      fullName: `Nombre ${gamertag}`,
      gamertag,
      email: `${gamertag.toLowerCase()}@example.com`,
      pin: encryptPin(pin),
      pinLookup: hashPinForLookup(pin),
    },
  });
}

async function createEntry(visitorId: string) {
  return getPrisma().tournamentEntry.create({ data: { visitorId, channel: "pre", status: "registered" } });
}

async function createAccount(data: { status: string; password: string | null }) {
  counter += 1;

  return getPrisma().account.create({
    data: { email: `cuenta${counter}@ut.mx`, name: `Cuenta ${counter}`, role: "help_desk", ...data },
  });
}
