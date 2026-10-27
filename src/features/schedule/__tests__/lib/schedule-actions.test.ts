/**
 * @jest-environment node
 */
import type * as NextCache from "next/cache";
import { deleteScheduleItem, saveScheduleItem } from "@features/schedule/lib/schedule-actions";
import { createSession } from "@shared/lib/server/session";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

const FINAL = {
  title: "Gran final de KOF",
  description: "Los dos finalistas se enfrentan en el escenario.",
  startsAt: "2026-11-20T17:05",
  endsAt: "2026-11-20T17:30",
  zone: "stage",
};

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let sysadminId = "";

let auditCountBefore = 0;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  stubCookies(createCookieJar());
  updateTag.mockClear();
  await getPrisma().scheduleItem.deleteMany();
  await getPrisma().session.deleteMany();
  sysadminId = await ensureAccount("sysadmin");
  auditCountBefore = await getPrisma().auditLog.count({ where: { entityType: "schedule_item" } });
});

describe("saveScheduleItem", () => {
  it("creates the item in UTC, refreshes the public schedule and records who did it", async () => {
    await signInAs(sysadminId);

    expect(await saveScheduleItem(null, form(FINAL))).toEqual({ status: "saved" });

    const [item] = await getPrisma().scheduleItem.findMany();

    expect(item).toMatchObject({
      title: "Gran final de KOF",
      description: "Los dos finalistas se enfrentan en el escenario.",
      startsAt: new Date("2026-11-20T22:05:00.000Z"),
      endsAt: new Date("2026-11-20T22:30:00.000Z"),
      zone: "stage",
    });
    expect(updateTag).toHaveBeenCalledWith("schedule");
    expect(await lastAudit()).toMatchObject({
      actorId: sysadminId,
      action: "schedule_item.create",
      entityType: "schedule_item",
      entityId: item.id,
    });
  });

  it("updates an existing item and stores no zone when 'Sin zona' is chosen", async () => {
    await signInAs(sysadminId);
    await saveScheduleItem(null, form(FINAL));
    const [created] = await getPrisma().scheduleItem.findMany();

    await saveScheduleItem(null, form({ ...FINAL, id: created.id, title: "Final de KOF", zone: "none" }));

    expect(await getPrisma().scheduleItem.findMany()).toEqual([
      expect.objectContaining({ id: created.id, title: "Final de KOF", zone: null }),
    ]);
    expect(await lastAudit()).toMatchObject({ action: "schedule_item.update", entityId: created.id });
  });

  it("answers one message per invalid field and changes nothing", async () => {
    await signInAs(sysadminId);

    const result = await saveScheduleItem(
      null,
      form({ title: " ", description: "", startsAt: "mañana", endsAt: "2026-11-20T17:30", zone: "roof" }),
    );

    expect(result).toEqual({
      status: "invalid",
      errors: {
        title: "Escribe el título.",
        description: "Escribe una descripción breve.",
        startsAt: "Escribe una fecha y hora válidas.",
        zone: "Elige una zona del croquis o Sin zona.",
      },
    });
    expect(await getPrisma().scheduleItem.count()).toBe(0);
    expect(await getPrisma().auditLog.count({ where: { entityType: "schedule_item" } })).toBe(auditCountBefore);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("rejects an item that ends before it starts", async () => {
    await signInAs(sysadminId);

    expect(await saveScheduleItem(null, form({ ...FINAL, endsAt: "2026-11-20T17:00" }))).toEqual({
      status: "invalid",
      errors: { endsAt: "El fin no puede ser antes del inicio." },
    });
  });

  it("rejects a title over 120 characters and a description over 280", async () => {
    await signInAs(sysadminId);

    expect(
      await saveScheduleItem(null, form({ ...FINAL, title: "a".repeat(121), description: "b".repeat(281) })),
    ).toEqual({
      status: "invalid",
      errors: {
        title: "Usa como máximo 120 caracteres.",
        description: "Usa como máximo 280 caracteres.",
      },
    });
  });

  it("tells the sysadmin when the item to update no longer exists", async () => {
    await signInAs(sysadminId);

    expect(await saveScheduleItem(null, form({ ...FINAL, id: "deleted-item" }))).toEqual({
      status: "error",
      message: "La actividad ya no existe. Recarga la página.",
    });
  });

  it("sends a request without a sysadmin session to /login and changes nothing", async () => {
    const helpDeskId = await ensureAccount("help_desk");

    await signInAs(helpDeskId);

    await expect(saveScheduleItem(null, form(FINAL))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect(await getPrisma().scheduleItem.count()).toBe(0);
  });
});

describe("deleteScheduleItem", () => {
  it("deletes the item, refreshes the public schedule and records who did it", async () => {
    await signInAs(sysadminId);
    await saveScheduleItem(null, form(FINAL));
    const [created] = await getPrisma().scheduleItem.findMany();
    updateTag.mockClear();

    expect(await deleteScheduleItem(null, form({ id: created.id }))).toEqual({ status: "deleted" });

    expect(await getPrisma().scheduleItem.count()).toBe(0);
    expect(updateTag).toHaveBeenCalledWith("schedule");
    expect(await lastAudit()).toMatchObject({
      actorId: sysadminId,
      action: "schedule_item.delete",
      entityId: created.id,
      detail: expect.objectContaining({ title: "Gran final de KOF" }),
    });
  });

  it("sends a request without a session to /login and keeps the item", async () => {
    await getPrisma().scheduleItem.create({
      data: { title: "Apertura", description: "Abren las puertas.", startsAt: new Date(), endsAt: new Date() },
    });

    await expect(deleteScheduleItem(null, form({ id: "any" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect(await getPrisma().scheduleItem.count()).toBe(1);
  });
});

async function ensureAccount(role: string): Promise<string> {
  const email = `${role}@ut.mx`;

  const account = await getPrisma().account.upsert({
    where: { email },
    create: { email, name: role, role, status: "active", password: "scrypt$1$1$1$a$b" },
    update: {},
  });

  return account.id;
}

function signInAs(accountId: string) {
  return createSession(accountId);
}

// SQLite returns rows in insertion order, which is finer than the millisecond createdAt.
async function lastAudit() {
  return (await getPrisma().auditLog.findMany({ where: { entityType: "schedule_item" } })).at(-1);
}

function form(fields: Record<string, string>) {
  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.set(name, value));

  return data;
}
