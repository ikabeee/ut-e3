/**
 * @jest-environment node
 */
import { parseBlockedEmails } from "@features/visitors/lib/email-blocklist-input";
import { addBlockedEmails, listBlockedEmails, removeBlockedEmail } from "@features/visitors/lib/server/email-blocklist";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

let actorId = "";

beforeAll(async () => {
  actorId = (
    await getPrisma().account.create({
      data: {
        email: "sysadmin@example.test",
        name: "Coordinación",
        role: "sysadmin",
        status: "active",
        password: "hash",
      },
    })
  ).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

function emailsForm(text: string) {
  const form = new FormData();

  form.set("emails", text);

  return form;
}

describe("parseBlockedEmails (RF-44)", () => {
  it("splits by lines or commas, lowercases and removes repeats", () => {
    expect(parseBlockedEmails(emailsForm("Ana@Equipo.mx, beto@equipo.mx\nana@equipo.mx"))).toEqual({
      isValid: true,
      emails: ["ana@equipo.mx", "beto@equipo.mx"],
    });
  });

  it("names the first invalid address and refuses an empty list", () => {
    expect(parseBlockedEmails(emailsForm("ana@equipo.mx no-es-correo"))).toEqual({
      isValid: false,
      reason: "invalid",
      invalid: "no-es-correo",
    });
    expect(parseBlockedEmails(emailsForm("  "))).toEqual({ isValid: false, reason: "empty" });
  });
});

describe("the blocklist in the database (RF-44)", () => {
  it("adds only new addresses, flags the ones with a passport and removes one", async () => {
    await getPrisma().visitor.create({
      data: { fullName: "Ana", gamertag: "ana", email: "ANA@equipo.mx", pin: "x", pinLookup: "y" },
    });

    await expect(addBlockedEmails(actorId, ["ana@equipo.mx", "beto@equipo.mx"])).resolves.toBe(2);
    await expect(addBlockedEmails(actorId, ["ana@equipo.mx", "carla@equipo.mx"])).resolves.toBe(1);
    await expect(listBlockedEmails()).resolves.toEqual([
      expect.objectContaining({ email: "ana@equipo.mx", hasPassport: true }),
      expect.objectContaining({ email: "beto@equipo.mx", hasPassport: false }),
      expect.objectContaining({ email: "carla@equipo.mx", hasPassport: false }),
    ]);
    await expect(removeBlockedEmail(actorId, "beto@equipo.mx")).resolves.toBe(true);
    await expect(removeBlockedEmail(actorId, "beto@equipo.mx")).resolves.toBe(false);

    const audits = await getPrisma().auditLog.findMany({ where: { entityType: "email_blocklist" } });

    expect(audits).toHaveLength(4);
    expect(JSON.stringify(audits)).not.toContain("@equipo.mx");
  });
});
