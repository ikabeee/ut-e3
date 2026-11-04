/**
 * @jest-environment node
 */
import { parseSponsorInput } from "@features/sponsors/lib/sponsor-input";
import { deleteSponsor, saveSponsor } from "@features/sponsors/lib/server/sponsor-mutations";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const VALID = {
  name: "Nodo Caribe",
  logoPath: "/sponsors/nodo-caribe.svg",
  websiteUrl: "https://example.com/nodo",
  phone: "+52 998 123 4567",
  services: "Servidores en la nube.",
  position: "3",
};

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

function sponsorForm(changes: Partial<typeof VALID> = {}) {
  const form = new FormData();

  for (const [name, value] of Object.entries({ ...VALID, ...changes })) form.set(name, value);

  return form;
}

describe("parseSponsorInput (RF-41)", () => {
  it("normalizes the phone to E.164 and reads the position", () => {
    expect(parseSponsorInput(sponsorForm())).toEqual({
      isValid: true,
      sponsor: { ...VALID, phone: "+529981234567", position: 3 },
    });
  });

  it("refuses a remote or climbing logo, a plain http site and a phone without +", () => {
    const parsed = parseSponsorInput(
      sponsorForm({ logoPath: "/../secret.png", websiteUrl: "http://example.com", phone: "9981234567", position: "0" }),
    );

    expect(parsed).toMatchObject({
      isValid: false,
      errors: {
        logoPath: expect.any(String),
        websiteUrl: expect.any(String),
        phone: expect.any(String),
        position: expect.any(String),
      },
    });
    expect(parseSponsorInput(sponsorForm({ logoPath: "https://cdn.example.com/a.png" })).isValid).toBe(false);
  });
});

describe("saveSponsor and deleteSponsor (RF-41)", () => {
  it("creates, edits and deletes a sponsor, each with its audit entry", async () => {
    const parsed = parseSponsorInput(sponsorForm());

    if (!parsed.isValid) throw new Error("The valid sponsor did not parse.");

    await expect(saveSponsor(actorId, "", parsed.sponsor)).resolves.toEqual({ status: "saved" });

    const stored = await getPrisma().sponsor.findFirstOrThrow();

    await expect(saveSponsor(actorId, stored.id, { ...parsed.sponsor, name: "Nodo" })).resolves.toEqual({
      status: "saved",
    });
    await expect(saveSponsor(actorId, "missing", parsed.sponsor)).resolves.toEqual({ status: "notFound" });
    await expect(getPrisma().sponsor.findUniqueOrThrow({ where: { id: stored.id } })).resolves.toMatchObject({
      name: "Nodo",
    });
    await expect(deleteSponsor(actorId, stored.id)).resolves.toEqual({ status: "saved" });
    await expect(deleteSponsor(actorId, stored.id)).resolves.toEqual({ status: "notFound" });
    await expect(getPrisma().auditLog.count({ where: { entityType: "sponsor" } })).resolves.toBe(3);
  });

  it("refuses a logo that is not a file of public/, so the landing shows no broken image", async () => {
    const parsed = parseSponsorInput(sponsorForm({ logoPath: "/sponsors/no-existe.svg" }));

    if (!parsed.isValid) throw new Error("expected a valid form");

    await expect(saveSponsor(actorId, "", parsed.sponsor)).resolves.toEqual({ status: "missingLogo" });
    await expect(getPrisma().sponsor.count({ where: { logoPath: "/sponsors/no-existe.svg" } })).resolves.toBe(0);
  });

  it("answers rejected when the CHECK of the phone refuses the row", async () => {
    const parsed = parseSponsorInput(sponsorForm());

    if (!parsed.isValid) throw new Error("The valid sponsor did not parse.");

    await expect(saveSponsor(actorId, "", { ...parsed.sponsor, phone: "998" })).resolves.toEqual({
      status: "rejected",
    });
  });
});
