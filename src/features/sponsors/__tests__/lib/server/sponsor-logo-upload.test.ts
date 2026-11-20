/**
 * @jest-environment node
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type * as NextCache from "next/cache";
import {
  buildGarbage,
  buildJpeg,
  buildPng,
  buildSvg,
  buildWebp,
  padTo,
} from "@features/sponsors/__tests__/lib/logo-fixture";
import { parseSponsorInput } from "@features/sponsors/lib/sponsor-input";
import { LOGO_MAX_BYTES } from "@features/sponsors/lib/sponsor-logo";
import { saveSponsorAction, deleteSponsorAction } from "@features/sponsors/lib/sponsors-admin-actions";
import { SPONSORS_COPY } from "@features/sponsors/lib/sponsors-copy";
import { deleteSponsor, saveSponsorWithLogo } from "@features/sponsors/lib/server/sponsor-mutations";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

const database = createTestDatabase();

const uploadsDirectory = mkdtempSync(path.join(tmpdir(), "ut-e3-test-uploads-"));

process.env.DATABASE_URL = database.url;

process.env.UPLOADS_DIR = uploadsDirectory;

const COPY = SPONSORS_COPY.admin;

const PNG = buildPng({ width: 600, height: 300 });

const TEXT = {
  name: "Nodo Caribe",
  logoPath: "",
  websiteUrl: "",
  phone: "",
  email: "",
  services: "",
  position: "1",
};

let sysadminId = "";

// The audit log only takes inserts, so each test compares against the entries that were there when it began.
let auditBefore = 0;

beforeAll(async () => {
  sysadminId = (
    await getPrisma().account.create({
      data: { email: "sysadmin@ut.mx", name: "Coordinación", role: "sysadmin", status: "active", password: "hash" },
    })
  ).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
  rmSync(uploadsDirectory, { recursive: true, force: true });
});

beforeEach(async () => {
  refresh.mockClear();
  updateTag.mockClear();
  stubCookies(createCookieJar());
  await getPrisma().session.deleteMany();
  await getPrisma().sponsor.deleteMany();
  auditBefore = await getPrisma().auditLog.count();
  rmSync(path.join(uploadsDirectory, "sponsors"), { recursive: true, force: true });
  await createSession(sysadminId);
});

function sponsorForm(fields: Partial<typeof TEXT> & { id?: string } = {}, logo?: { bytes: Uint8Array; name?: string }) {
  const form = new FormData();

  for (const [name, value] of Object.entries({ ...TEXT, ...fields })) form.set(name, value);

  if (logo) form.set("logoFile", new File([Uint8Array.from(logo.bytes)], logo.name ?? "logo.png"));

  return form;
}

async function expectNothingWritten() {
  expect(storedFiles()).toEqual([]);
  await expect(getPrisma().sponsor.count()).resolves.toBe(0);
  await expect(getPrisma().auditLog.count()).resolves.toBe(auditBefore);
  expect(updateTag).not.toHaveBeenCalled();
}

function storedFiles(): string[] {
  const directory = path.join(uploadsDirectory, "sponsors");

  return existsSync(directory) ? readdirSync(directory).toSorted() : [];
}

function hash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 12);
}

describe("saveSponsorAction with a logo file (S3)", () => {
  it("creates the sponsor with the uploaded PNG: file, row, audit and refreshed cache", async () => {
    const state = await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));
    const fileName = `sponsor-nodo-caribe-${hash(PNG)}.png`;

    expect(state).toEqual({ status: "done", message: COPY.outcomes.created });
    expect(storedFiles()).toEqual([fileName]);
    expect(new Uint8Array(readFileSync(path.join(uploadsDirectory, "sponsors", fileName)))).toEqual(PNG);

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();

    expect(sponsor.logoPath).toBe(`/api/media/sponsors/${fileName}`);

    const entries = await getPrisma().auditLog.findMany({ where: { entityId: sponsor.id } });
    const actions = entries.map((row) => row.action);

    expect(actions.toSorted()).toEqual(["sponsor.create", "sponsor.logo.save"]);
    expect(updateTag).toHaveBeenCalledWith("sponsors");
    expect(refresh).toHaveBeenCalled();
  });

  it.each([
    { label: "PNG named .jpg", bytes: PNG, clientName: "logo.jpg", extension: "png" },
    {
      label: "JPEG named .png",
      bytes: buildJpeg({ width: 200, height: 100 }),
      clientName: "logo.png",
      extension: "jpg",
    },
    { label: "lossy WebP", bytes: buildWebp({ width: 200, height: 100 }), clientName: "logo.webp", extension: "webp" },
    {
      label: "lossless WebP named .png",
      bytes: buildWebp({ width: 200, height: 100, kind: "lossless" }),
      clientName: "logo.png",
      extension: "webp",
    },
  ])("stores a $label with the extension of what it is", async ({ bytes, clientName, extension }) => {
    const state = await saveSponsorAction(null, sponsorForm({}, { bytes, name: clientName }));

    expect(state.status).toBe("done");
    expect(storedFiles()).toEqual([`sponsor-nodo-caribe-${hash(bytes)}.${extension}`]);
  });

  it("prefers the file over the path that was typed", async () => {
    await saveSponsorAction(null, sponsorForm({ logoPath: "/sponsors/nodo-caribe.svg" }, { bytes: PNG }));

    await expect(getPrisma().sponsor.findFirstOrThrow()).resolves.toMatchObject({
      logoPath: `/api/media/sponsors/sponsor-nodo-caribe-${hash(PNG)}.png`,
    });
  });

  it.each([
    ["an SVG named .png", buildSvg(), COPY.errors.logoFormat],
    ["garbage named .png", buildGarbage(), COPY.errors.logoFormat],
    ["a cut PNG", buildPng({ width: 10, height: 10, hasEnd: false }), COPY.errors.logoFormat],
    ["a PNG over 4000 px", buildPng({ width: 4001, height: 100 }), COPY.errors.logoDimensions],
    ["a file over 2 MB", padTo(PNG, LOGO_MAX_BYTES + 1), COPY.errors.logoTooLarge],
  ])("refuses %s and writes nothing", async (_label, bytes, message) => {
    const state = await saveSponsorAction(null, sponsorForm({}, { bytes }));

    expect(state).toEqual({ status: "error", message });
    await expectNothingWritten();
  });

  it("accepts a file of exactly 2 MB", async () => {
    const exact = buildPng({ width: 600, height: 300, paddingBytes: LOGO_MAX_BYTES - PNG.length });

    expect(exact.byteLength).toBe(LOGO_MAX_BYTES);
    await expect(saveSponsorAction(null, sponsorForm({}, { bytes: exact }))).resolves.toMatchObject({ status: "done" });
  });

  it("refuses the form fields before it writes the file", async () => {
    const state = await saveSponsorAction(null, sponsorForm({ name: "", phone: "123" }, { bytes: PNG }));

    expect(state).toMatchObject({ status: "error", errors: { name: expect.any(String), phone: expect.any(String) } });
    await expectNothingWritten();
  });

  it("asks for a logo when there is neither a file nor a path", async () => {
    const state = await saveSponsorAction(null, sponsorForm());

    expect(state).toMatchObject({ status: "error", errors: { logoPath: COPY.errors.logoPath } });
    await expectNothingWritten();
  });

  it("keeps the public/ logos working: no file, a path of public/, nothing in the volume", async () => {
    const state = await saveSponsorAction(null, sponsorForm({ logoPath: "/sponsors/nodo-caribe.svg" }));

    expect(state).toEqual({ status: "done", message: COPY.outcomes.created });
    expect(storedFiles()).toEqual([]);
    await expect(getPrisma().sponsor.findFirstOrThrow()).resolves.toMatchObject({
      logoPath: "/sponsors/nodo-caribe.svg",
    });

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();

    await expect(getPrisma().auditLog.findMany({ where: { entityId: sponsor.id } })).resolves.toEqual([
      expect.objectContaining({ action: "sponsor.create" }),
    ]);
  });

  it("answers with a message and leaves no file when the database fails", async () => {
    const failing = jest.spyOn(getPrisma(), "$transaction").mockRejectedValueOnce(new Error("database down"));
    const logged = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const state = await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    failing.mockRestore();
    logged.mockRestore();
    expect(state).toEqual({ status: "error", message: COPY.errors.unexpected });
    await expectNothingWritten();
  });
});

describe("replacing and deleting an uploaded logo (S3)", () => {
  it("replaces the logo of a sponsor and removes the previous uploaded file", async () => {
    await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();
    const next = buildJpeg({ width: 300, height: 300 });
    const state = await saveSponsorAction(null, sponsorForm({ id: sponsor.id }, { bytes: next }));

    expect(state).toEqual({ status: "done", message: COPY.outcomes.updated });
    expect(storedFiles()).toEqual([`sponsor-nodo-caribe-${hash(next)}.jpg`]);
    await expect(getPrisma().sponsor.findUniqueOrThrow({ where: { id: sponsor.id } })).resolves.toMatchObject({
      logoPath: `/api/media/sponsors/sponsor-nodo-caribe-${hash(next)}.jpg`,
    });
  });

  it("uploads the same file again without deleting it", async () => {
    await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();

    await saveSponsorAction(null, sponsorForm({ id: sponsor.id, position: "2" }, { bytes: PNG }));

    expect(storedFiles()).toEqual([`sponsor-nodo-caribe-${hash(PNG)}.png`]);
  });

  it("keeps the previous file while another sponsor still shows it", async () => {
    await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    const first = await getPrisma().sponsor.findFirstOrThrow();

    await getPrisma().sponsor.create({ data: { ...TEXT, name: "Copia", logoPath: first.logoPath, position: 2 } });
    await saveSponsorAction(null, sponsorForm({ id: first.id }, { bytes: buildJpeg({ width: 50, height: 50 }) }));

    expect(storedFiles()).toHaveLength(2);
    expect(storedFiles()).toContain(first.logoPath.split("/").pop());
  });

  it("never deletes a file of public/ when a sponsor changes from it to an upload", async () => {
    await getPrisma().sponsor.create({ data: { ...TEXT, logoPath: "/sponsors/nodo-caribe.svg", position: 1 } });

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();

    await saveSponsorAction(null, sponsorForm({ id: sponsor.id }, { bytes: PNG }));

    expect(existsSync(path.join(process.cwd(), "public", "sponsors", "nodo-caribe.svg"))).toBe(true);
    expect(storedFiles()).toHaveLength(1);
  });

  it("removes the file of a deleted sponsor unless another one shows it", async () => {
    await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();

    await expect(deleteSponsor(sysadminId, sponsor.id)).resolves.toEqual({ status: "saved" });
    expect(storedFiles()).toEqual([]);
  });

  it("keeps the file of a deleted sponsor while another one shows it", async () => {
    await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();

    await getPrisma().sponsor.create({ data: { ...TEXT, name: "Copia", logoPath: sponsor.logoPath, position: 2 } });
    await deleteSponsor(sysadminId, sponsor.id);

    expect(storedFiles()).toHaveLength(1);
  });

  it("deletes through the action as well", async () => {
    await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();
    const form = new FormData();

    form.set("id", sponsor.id);
    await deleteSponsorAction(null, form);

    expect(storedFiles()).toEqual([]);
  });
});

describe("saveSponsorWithLogo (S3)", () => {
  function parsedSponsor() {
    const parsed = parseSponsorInput(sponsorForm({ logoPath: "/sponsors/nodo-caribe.svg" }));

    if (!parsed.isValid) throw new Error("The sponsor did not parse.");

    return parsed.sponsor;
  }

  const logo = { fileName: `sponsor-nodo-caribe-${hash(PNG)}.png`, bytes: PNG };

  it("removes the new file when the database refuses the row", async () => {
    const result = await saveSponsorWithLogo({
      actorId: sysadminId,
      id: "",
      sponsor: { ...parsedSponsor(), phone: "abc" },
      logo,
    });

    expect(result).toEqual({ status: "rejected" });
    await expectNothingWritten();
  });

  it("removes the new file when the database throws", async () => {
    const failing = jest.spyOn(getPrisma(), "$transaction").mockRejectedValueOnce(new Error("database down"));

    await expect(saveSponsorWithLogo({ actorId: sysadminId, id: "", sponsor: parsedSponsor(), logo })).rejects.toThrow(
      "database down",
    );

    failing.mockRestore();
    await expectNothingWritten();
  });

  it("removes the new file when the sponsor to edit no longer exists", async () => {
    const result = await saveSponsorWithLogo({ actorId: sysadminId, id: "missing", sponsor: parsedSponsor(), logo });

    expect(result).toEqual({ status: "notFound" });
    await expectNothingWritten();
  });

  it("keeps a file that the sponsor already showed when its edit fails", async () => {
    await saveSponsorAction(null, sponsorForm({}, { bytes: PNG }));

    const sponsor = await getPrisma().sponsor.findFirstOrThrow();

    const result = await saveSponsorWithLogo({
      actorId: sysadminId,
      id: sponsor.id,
      sponsor: { ...parsedSponsor(), phone: "abc" },
      logo,
    });

    expect(result).toEqual({ status: "rejected" });
    expect(storedFiles()).toEqual([logo.fileName]);
  });

  it("accepts the path of an uploaded file that exists and refuses one that does not", async () => {
    mkdirSync(path.join(uploadsDirectory, "sponsors"), { recursive: true });
    writeFileSync(path.join(uploadsDirectory, "sponsors", logo.fileName), PNG);

    const sponsor = parsedSponsor();
    const present = { ...sponsor, logoPath: `/api/media/sponsors/${logo.fileName}` };
    const absent = { ...sponsor, logoPath: `/api/media/sponsors/sponsor-otro-${hash(PNG)}.png` };

    await expect(saveSponsorWithLogo({ actorId: sysadminId, id: "", sponsor: present, logo: null })).resolves.toEqual({
      status: "saved",
    });
    await expect(saveSponsorWithLogo({ actorId: sysadminId, id: "", sponsor: absent, logo: null })).resolves.toEqual({
      status: "missingLogo",
    });
  });
});
