/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import type * as NextServer from "next/server";
import {
  resendPassportAction,
  sendRecoveryLinkAction,
  updateVisitorAction,
} from "@features/visitors/lib/visitors-admin-actions";
import { VISITORS_ADMIN_COPY } from "@features/visitors/lib/visitors-admin-copy";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import {
  auditEntriesSince,
  clearVisitorTables,
  countAuditEntries,
  createVisitor,
  editForm,
  visitorForm,
} from "@features/visitors/__tests__/lib/server/visitors-admin-utils";
import { VISITOR_PINS_CACHE_TAG } from "@features/visitors/lib/visitor-cache-tags";
import { getPrisma } from "@shared/lib/server/prisma";
import { expectRefused, otherRoleCases, signInAs } from "@shared/__tests__/lib/server/sysadmin-only";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const nextServer = jest.requireActual<typeof NextServer>("next/server");

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

jest.spyOn(nextServer, "after").mockImplementation(() => undefined);

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 6).toString("base64");

const ERRORS = VISITORS_ADMIN_COPY.errors;

const FIELD_ERRORS = VISITORS_COPY.errors;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

let auditBaseline = 0;

beforeEach(async () => {
  updateTag.mockClear();
  await clearVisitorTables();
  auditBaseline = await countAuditEntries();
});

async function auditEntries() {
  return auditEntriesSince(auditBaseline);
}

describe("who can use the actions", () => {
  it.each(otherRoleCases({ resendPassportAction, sendRecoveryLinkAction, updateVisitorAction }))(
    "%s calling %s is sent to the login and writes nothing",
    async (role, _name, action) => {
      await createVisitor({ gamertag: "Guard" });
      await expectRefused(role, action);
      await expect(getPrisma().emailOutbox.count()).resolves.toBe(0);
    },
  );
});

describe("resendPassportAction", () => {
  it("queues the registration email with the decrypted PIN to the visitor's email", async () => {
    await signInAs("sysadmin");

    const visitor = await createVisitor({ gamertag: "Resend", pin: "48271", email: "resend@ut.mx" });
    const result = await resendPassportAction(null, visitorForm(visitor.id));
    const emails = await getPrisma().emailOutbox.findMany();

    expect(result).toEqual({ status: "done", message: VISITORS_ADMIN_COPY.outcomes.passportResent });
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({ to: "resend@ut.mx", subject: "Tu pasaporte UT Game Showcase - Resend" });
    expect(emails[0].text).toContain("48271");
  });

  it("audits the resend without the PIN or the email text", async () => {
    const sysadminId = await signInAs("sysadmin");
    const visitor = await createVisitor({ gamertag: "Audited", pin: "48271" });

    await resendPassportAction(null, visitorForm(visitor.id));

    const entries = await auditEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      actorId: sysadminId,
      action: "visitor.passport_resent",
      entityType: "visitor",
      entityId: visitor.id,
    });
    expect(JSON.stringify(entries[0])).not.toContain("48271");
  });

  it("answers an error and queues nothing for a visitor that does not exist", async () => {
    await signInAs("sysadmin");

    await expect(resendPassportAction(null, visitorForm("missing"))).resolves.toEqual({
      status: "error",
      message: ERRORS.notFound,
    });
    await expect(getPrisma().emailOutbox.count()).resolves.toBe(0);
    await expect(auditEntries()).resolves.toEqual([]);
  });
});

describe("sendRecoveryLinkAction", () => {
  it("queues the recovery link without the PIN and audits it with the sysadmin as actor", async () => {
    const sysadminId = await signInAs("sysadmin");
    const visitor = await createVisitor({ gamertag: "Recover", pin: "48271", email: "recover@ut.mx" });

    const result = await sendRecoveryLinkAction(null, visitorForm(visitor.id));
    const [email] = await getPrisma().emailOutbox.findMany();

    expect(result).toEqual({ status: "done", message: VISITORS_ADMIN_COPY.outcomes.recoverySent });
    expect(email).toMatchObject({ to: "recover@ut.mx", subject: "Recupera tu pasaporte" });
    expect(email.text).toContain("/passport/claim/");
    expect(email.text).not.toContain("48271");
    await expect(getPrisma().recoveryToken.count({ where: { visitorId: visitor.id, usedAt: null } })).resolves.toBe(1);
    await expect(auditEntries()).resolves.toEqual([
      expect.objectContaining({
        actorId: sysadminId,
        action: "passport_recovery_requested",
        entityId: visitor.id,
      }),
    ]);
  });

  it("is not stopped by the three-per-hour limit of the visitor", async () => {
    await signInAs("sysadmin");

    const visitor = await createVisitor({ gamertag: "Limit" });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(sendRecoveryLinkAction(null, visitorForm(visitor.id))).resolves.toMatchObject({ status: "done" });
    }

    await expect(getPrisma().emailOutbox.count()).resolves.toBe(5);
  });

  it("answers an error and writes nothing for a visitor that does not exist", async () => {
    await signInAs("sysadmin");

    await expect(sendRecoveryLinkAction(null, visitorForm("missing"))).resolves.toEqual({
      status: "error",
      message: ERRORS.notFound,
    });
    await expect(getPrisma().recoveryToken.count()).resolves.toBe(0);
    await expect(getPrisma().emailOutbox.count()).resolves.toBe(0);
  });
});

describe("updateVisitorAction", () => {
  const FIELDS = { fullName: "Nombre Edit", gamertag: "Edit", email: "edit@example.com" };

  it("saves a new name, gamertag and email (lowercased) and audits which fields changed", async () => {
    const sysadminId = await signInAs("sysadmin");
    const visitor = await createVisitor({ gamertag: "Edit" });

    const result = await updateVisitorAction(
      null,
      editForm(visitor.id, { fullName: "Nuevo Nombre", gamertag: "Renamed", email: "  Nuevo@Correo.MX " }),
    );

    const saved = await getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } });
    const [entry] = await auditEntries();

    expect(result).toEqual({ status: "done", message: VISITORS_ADMIN_COPY.outcomes.updated });
    expect(saved).toMatchObject({ fullName: "Nuevo Nombre", gamertag: "Renamed", email: "nuevo@correo.mx" });
    expect(saved.pin).toBe(visitor.pin);
    expect(entry).toMatchObject({ actorId: sysadminId, action: "visitor.update", entityId: visitor.id });
    expect(entry.detail).toEqual({
      fields: ["fullName", "gamertag", "email"],
      gamertag: { from: "Edit", to: "Renamed" },
    });
    expect(JSON.stringify(entry)).not.toContain("correo.mx");
  });

  it("says so and writes nothing when nothing changed", async () => {
    await signInAs("sysadmin");

    const visitor = await createVisitor({ gamertag: "Edit", fullName: "Nombre Edit", email: "edit@example.com" });

    await expect(updateVisitorAction(null, editForm(visitor.id, FIELDS))).resolves.toEqual({
      status: "error",
      message: ERRORS.unchanged,
    });
    await expect(auditEntries()).resolves.toEqual([]);
  });

  it("does not touch the cache of PINs, since the email is not part of it", async () => {
    await signInAs("sysadmin");

    const visitor = await createVisitor({ gamertag: "Edit" });

    await updateVisitorAction(null, editForm(visitor.id, { ...FIELDS, email: "otro@example.com" }));

    expect(updateTag).not.toHaveBeenCalledWith(VISITOR_PINS_CACHE_TAG);
  });

  it.each([
    ["an email without a domain", { email: "sin-dominio" }, FIELD_ERRORS.emailInvalid],
    ["an empty email", { email: "" }, FIELD_ERRORS.emailRequired],
    ["a gamertag with spaces", { gamertag: "dos palabras" }, FIELD_ERRORS.gamertagFormat],
    ["a gamertag that is too short", { gamertag: "ab" }, FIELD_ERRORS.gamertagLength],
    ["a name that is too short", { fullName: "ab" }, FIELD_ERRORS.fullNameLength],
  ])("rejects %s and leaves the visitor as it was", async (_label, change, message) => {
    await signInAs("sysadmin");

    const visitor = await createVisitor({ gamertag: "Edit", fullName: "Nombre Edit", email: "edit@example.com" });

    await expect(updateVisitorAction(null, editForm(visitor.id, { ...FIELDS, ...change }))).resolves.toEqual({
      status: "error",
      message,
    });
    await expect(getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } })).resolves.toEqual(visitor);
    await expect(auditEntries()).resolves.toEqual([]);
  });

  it.each([
    ["on the blocklist", ERRORS.emailBlocked],
    ["of a staff account", ERRORS.emailBlocked],
    ["of another passport", ERRORS.emailTaken],
  ])("rejects an email %s and leaves the visitor as it was", async (kind, message) => {
    await signInAs("sysadmin");

    const visitor = await createVisitor({ gamertag: "Edit", fullName: "Nombre Edit", email: "edit@example.com" });

    await createVisitor({ gamertag: "Neighbour", email: "vecino@example.com" });
    await getPrisma().emailBlocklist.create({ data: { email: "bloqueado@example.com" } });
    await getPrisma().account.upsert({
      where: { email: "staff@example.com" },
      update: {},
      create: { email: "staff@example.com", name: "Staff", role: "help_desk", status: "active", password: "x" },
    });

    const email =
      { "on the blocklist": "BLOQUEADO@example.com", "of a staff account": "staff@example.com" }[kind] ??
      "Vecino@Example.com";

    await expect(updateVisitorAction(null, editForm(visitor.id, { ...FIELDS, email }))).resolves.toEqual({
      status: "error",
      message,
    });
    await expect(getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } })).resolves.toEqual(visitor);
    await expect(auditEntries()).resolves.toEqual([]);
  });

  it("rejects a gamertag that another passport has, without changing the name or email either", async () => {
    await signInAs("sysadmin");

    const visitor = await createVisitor({ gamertag: "Edit", fullName: "Nombre Edit", email: "edit@example.com" });

    await createVisitor({ gamertag: "Taken" });

    await expect(
      updateVisitorAction(
        null,
        editForm(visitor.id, { fullName: "Otro Nombre", gamertag: "taken", email: "nuevo@example.com" }),
      ),
    ).resolves.toEqual({ status: "error", message: ERRORS.gamertagTaken });
    await expect(getPrisma().visitor.findUniqueOrThrow({ where: { id: visitor.id } })).resolves.toEqual(visitor);
    await expect(auditEntries()).resolves.toEqual([]);
  });

  it("answers an error for a visitor that does not exist", async () => {
    await signInAs("sysadmin");

    await expect(updateVisitorAction(null, editForm("missing", FIELDS))).resolves.toEqual({
      status: "error",
      message: ERRORS.notFound,
    });
  });
});
