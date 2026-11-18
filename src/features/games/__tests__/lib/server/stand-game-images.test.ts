/**
 * @jest-environment node
 */
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type * as NextCache from "next/cache";
import { GAME_IMAGE_MAX_BYTES } from "@features/games/lib/game-image-validation";
import { getGalleryImages, GENERIC_COVER_PATH } from "@features/games/lib/game-cover";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { deleteStandGameAction } from "@features/games/lib/stand-game-actions";
import { deleteGameImageAction, uploadGameImageAction } from "@features/games/lib/stand-game-image-actions";
import { getPrisma } from "@shared/lib/server/prisma";
import { createSession } from "@shared/lib/server/session";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";
import { buildJpeg } from "@features/games/__tests__/lib/jpeg-fixture";

const nextCache = jest.requireActual<typeof NextCache>("next/cache");

const refresh = jest.spyOn(nextCache, "refresh").mockImplementation(() => undefined);

const updateTag = jest.spyOn(nextCache, "updateTag").mockImplementation(() => undefined);

const database = createTestDatabase();

const uploadsDirectory = mkdtempSync(path.join(tmpdir(), "ut-e3-test-uploads-"));

process.env.DATABASE_URL = database.url;

process.env.UPLOADS_DIR = uploadsDirectory;

const COPY = GAMES_COPY.standGame.images;

const CARD = buildJpeg({ width: 810, height: 1080 });

const LANDSCAPE = buildJpeg({ width: 1920, height: 1080 });

const ids = { admin: "", otherAdmin: "", staff: "", sysadmin: "", stand: "", otherStand: "", genre: "" };

beforeAll(async () => {
  ids.stand = (await createStand(1)).id;
  ids.otherStand = (await createStand(2)).id;
  ids.admin = (await createAccount({ email: "admin@ut.mx", role: "stand_admin", standId: ids.stand })).id;
  ids.otherAdmin = (await createAccount({ email: "other@ut.mx", role: "stand_admin", standId: ids.otherStand })).id;
  ids.staff = (await createAccount({ email: "staff@ut.mx", role: "stand_staff", standId: ids.stand })).id;
  ids.sysadmin = (await createAccount({ email: "sysadmin@ut.mx", role: "sysadmin" })).id;
  ids.genre = (await getPrisma().genre.create({ data: { name: "Acción", slug: "accion" } })).id;
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
  await getPrisma().gameImage.deleteMany();
  await getPrisma().game.deleteMany();
  rmSync(path.join(uploadsDirectory, "games"), { recursive: true, force: true });
  await createGame({ standId: ids.stand, slug: "ruta-9", name: "Ruta 9" });
  await createGame({ standId: ids.otherStand, slug: "otro", name: "Otro" });
  await signInAs(ids.admin);
});

describe("uploadGameImageAction (RF-31, grid of covers)", () => {
  it("stores each slot, shows them in the order of the grid and refreshes the games", async () => {
    await upload("screenshot-2", LANDSCAPE);
    await upload("card", CARD);
    await upload("screenshot-1", LANDSCAPE);

    const state = await upload("landscape", LANDSCAPE);

    expect(state).toEqual({ status: "done", message: COPY.outcomes.saved });

    const gallery = getGalleryImages({ images: await readImages(ids.stand) });

    expect(gallery.map((image) => image.position)).toEqual([2, 1, 3, 4]);
    expect(gallery.map((image) => image.isCover)).toEqual([false, true, false, false]);
    expect(gallery[0].path).toMatch(/^\/api\/media\/games\/ruta-9-portada-[0-9a-f]{8}\.jpg$/);
    expect(gallery[1].path).toMatch(/^\/api\/media\/games\/ruta-9-[0-9a-f]{8}\.jpg$/);
    expect(gallery[2].path).toMatch(/^\/api\/media\/games\/ruta-9-captura-01-[0-9a-f]{8}\.jpg$/);
    expect(listFiles()).toHaveLength(4);
    expect(updateTag).toHaveBeenCalledWith("games");
    expect(refresh).toHaveBeenCalled();
  });

  it("replaces the generic cover and then the image of the slot, deleting the old file", async () => {
    await upload("card", CARD);

    const first = (await readImages(ids.stand)).find((image) => image.position === 1);

    await upload("card", buildJpeg({ width: 810, height: 1080, paddingSegments: 1 }));

    const images = await readImages(ids.stand);

    expect(images).toHaveLength(1);
    expect(images[0].path).not.toBe(first?.path);
    expect(images[0].path).not.toBe(GENERIC_COVER_PATH);
    expect(listFiles()).toEqual([path.basename(images[0].path)]);
  });

  it("keeps the same file when the same image is uploaded again", async () => {
    await upload("landscape", LANDSCAPE);
    await upload("landscape", LANDSCAPE);

    expect(listFiles()).toHaveLength(1);
    expect(await readImages(ids.stand)).toHaveLength(2);
  });

  it("audits the upload with the slot and the file", async () => {
    await upload("screenshot-3", LANDSCAPE);

    const game = await getPrisma().game.findUniqueOrThrow({ where: { standId: ids.stand } });

    const entry = await getPrisma().auditLog.findFirstOrThrow({
      where: { action: "game.image.save", entityId: game.id },
    });

    expect(entry).toMatchObject({ actorId: ids.admin, entityType: "game" });
    expect(entry.detail).toMatchObject({ slot: "screenshot-3" });
  });

  it.each([
    {
      name: "a size that is not the one of the slot",
      slot: "card",
      bytes: LANDSCAPE,
      message: COPY.errors.wrongSize({ width: 1920, height: 1080 }, { width: 810, height: 1080 }),
    },
    { name: "a PNG named .jpg", slot: "card", bytes: pngBytes(), message: COPY.errors.notJpeg },
    {
      name: "a JPEG over 5 MB",
      slot: "landscape",
      bytes: buildJpeg({ width: 1920, height: 1080, paddingSegments: 81 }),
      message: COPY.errors.tooLarge,
    },
    {
      name: "a CMYK JPEG",
      slot: "landscape",
      bytes: buildJpeg({ width: 1920, height: 1080, components: 4 }),
      message: COPY.errors.notRgb,
    },
    {
      name: "a JPEG that is cut",
      slot: "landscape",
      bytes: buildJpeg({ width: 1920, height: 1080, hasEnd: false }),
      message: COPY.errors.notJpeg,
    },
    { name: "a fifth screenshot", slot: "screenshot-5", bytes: LANDSCAPE, message: COPY.errors.unknownSlot },
    { name: "a slot that does not exist", slot: "../card", bytes: LANDSCAPE, message: COPY.errors.unknownSlot },
    { name: "an empty file", slot: "card", bytes: new Uint8Array(), message: COPY.errors.missing },
    {
      name: "a card of 811x1080",
      slot: "card",
      bytes: buildJpeg({ width: 811, height: 1080 }),
      message: COPY.errors.wrongSize({ width: 811, height: 1080 }, { width: 810, height: 1080 }),
    },
    {
      name: "a vertical screenshot of 1080x1920",
      slot: "screenshot-1",
      bytes: buildJpeg({ width: 1080, height: 1920 }),
      message: COPY.errors.wrongSize({ width: 1080, height: 1920 }, { width: 1920, height: 1080 }),
    },
    {
      name: "a CMYK card",
      slot: "card",
      bytes: buildJpeg({ width: 810, height: 1080, components: 4 }),
      message: COPY.errors.notRgb,
    },
  ])("refuses $name and leaves the database and the files as they were", async ({ slot, bytes, message }) => {
    await upload("landscape", LANDSCAPE);

    const before = {
      images: await readImages(ids.stand),
      files: listFiles(),
      audits: await getPrisma().auditLog.count(),
    };

    updateTag.mockClear();

    expect(await upload(slot, bytes)).toEqual({ status: "error", message });
    expect(await readImages(ids.stand)).toEqual(before.images);
    expect(listFiles()).toEqual(before.files);
    expect(await getPrisma().auditLog.count()).toBe(before.audits);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("stores the fourth screenshot at position 6", async () => {
    expect(await upload("screenshot-4", LANDSCAPE)).toEqual({ status: "done", message: COPY.outcomes.saved });

    const images = await readImages(ids.stand);
    const fourth = images.find((image) => image.position === 6);

    expect(fourth?.path).toMatch(/^\/api\/media\/games\/ruta-9-captura-04-[0-9a-f]{8}\.jpg$/);
    expect(fourth?.isCover).toBe(false);
  });

  it("accepts a file of exactly 5 MB and refuses one that is a byte larger", async () => {
    const exact = padToSize(buildJpeg({ width: 1920, height: 1080 }), GAME_IMAGE_MAX_BYTES);
    const over = padToSize(buildJpeg({ width: 1920, height: 1080 }), GAME_IMAGE_MAX_BYTES + 1);

    expect(await upload("landscape", over)).toEqual({ status: "error", message: COPY.errors.tooLarge });
    expect(await readImages(ids.stand)).toHaveLength(1);
    expect(listFiles()).toEqual([]);
    expect(await upload("landscape", exact)).toEqual({ status: "done", message: COPY.outcomes.saved });
    expect(listFiles()).toHaveLength(1);
  });

  it("refuses a request without file", async () => {
    const data = new FormData();

    data.append("slot", "card");

    expect(await uploadGameImageAction(null, data)).toEqual({ status: "error", message: COPY.errors.missing });
  });

  it("removes the new file when the database fails and keeps the old image", async () => {
    await upload("landscape", LANDSCAPE);

    const before = { images: await readImages(ids.stand), files: listFiles() };

    const failing = jest.spyOn(getPrisma(), "$transaction").mockRejectedValueOnce(new Error("database down"));
    const logged = jest.spyOn(console, "error").mockImplementation(() => undefined);

    const state = await upload("landscape", buildJpeg({ width: 1920, height: 1080, paddingSegments: 1 }));

    failing.mockRestore();
    logged.mockRestore();
    expect(state).toEqual({ status: "error", message: COPY.errors.unexpected });
    expect(await readImages(ids.stand)).toEqual(before.images);
    expect(listFiles()).toEqual(before.files);
  });

  it("answers that the game is missing while the stand has none", async () => {
    await getPrisma().gameImage.deleteMany({ where: { game: { standId: ids.stand } } });
    await getPrisma().game.delete({ where: { standId: ids.stand } });

    expect(await upload("card", CARD)).toEqual({ status: "error", message: COPY.errors.noGame });
    expect(listFiles()).toEqual([]);
  });

  it("only touches the game of the stand of the session", async () => {
    await signInAs(ids.otherAdmin);
    await upload("card", CARD);

    expect(await readImages(ids.stand)).toEqual([expect.objectContaining({ path: GENERIC_COVER_PATH })]);
    expect((await readImages(ids.otherStand))[0].path).toMatch(/^\/api\/media\/games\/otro-/);
  });

  it("sends the staff and the other roles away without writing", async () => {
    await signInAs(ids.staff);
    await expect(upload("card", CARD)).rejects.toMatchObject({ digest: expect.stringContaining(";/stand/kiosk;") });
    await signInAs(ids.sysadmin);
    await expect(upload("card", CARD)).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
    stubCookies(createCookieJar());
    await expect(upload("card", CARD)).rejects.toMatchObject({ digest: expect.stringContaining(";/login;") });
    expect(listFiles()).toEqual([]);
  });

  it("rejects the maximum in bytes it documents", () => {
    expect(GAME_IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("deleteGameImageAction", () => {
  it("removes a screenshot, its file and audits it", async () => {
    await upload("screenshot-1", LANDSCAPE);
    updateTag.mockClear();

    const game = await getPrisma().game.findUniqueOrThrow({ where: { standId: ids.stand } });
    const state = await deleteGameImageAction(null, form({ slot: "screenshot-1" }));

    expect(state).toEqual({ status: "done", message: COPY.outcomes.removed });
    expect(await readImages(ids.stand)).toHaveLength(1);
    expect(listFiles()).toEqual([]);
    expect(await getPrisma().auditLog.count({ where: { action: "game.image.delete", entityId: game.id } })).toBe(1);
    expect(updateTag).toHaveBeenCalledWith("games");
  });

  it("does not remove the card or the landscape cover: they are replaced", async () => {
    await upload("card", CARD);
    await upload("landscape", LANDSCAPE);

    expect(await deleteGameImageAction(null, form({ slot: "card" }))).toEqual({
      status: "error",
      message: COPY.errors.onlyScreenshots,
    });
    expect(await deleteGameImageAction(null, form({ slot: "landscape" }))).toEqual({
      status: "error",
      message: COPY.errors.onlyScreenshots,
    });
    expect(await readImages(ids.stand)).toHaveLength(2);
  });

  it("answers that there is nothing to remove in an empty slot", async () => {
    expect(await deleteGameImageAction(null, form({ slot: "screenshot-4" }))).toEqual({
      status: "error",
      message: COPY.errors.emptySlot,
    });
  });

  it("never touches the screenshots of another stand", async () => {
    await signInAs(ids.otherAdmin);
    await upload("screenshot-1", LANDSCAPE);
    await signInAs(ids.admin);

    expect(await deleteGameImageAction(null, form({ slot: "screenshot-1" }))).toEqual({
      status: "error",
      message: COPY.errors.emptySlot,
    });
    expect(await readImages(ids.otherStand)).toHaveLength(2);
    expect(listFiles()).toHaveLength(1);
  });

  it("is closed to the staff", async () => {
    await signInAs(ids.staff);
    await expect(deleteGameImageAction(null, form({ slot: "screenshot-1" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/stand/kiosk;"),
    });
  });
});

describe("deleteStandGameAction (S27)", () => {
  it("deletes the game of the stand with its images and files, and audits it", async () => {
    await upload("card", CARD);
    await upload("screenshot-1", LANDSCAPE);
    await signInAs(ids.otherAdmin);
    await upload("card", CARD);
    await signInAs(ids.admin);
    updateTag.mockClear();

    const game = await getPrisma().game.findUniqueOrThrow({ where: { standId: ids.stand } });
    const state = await deleteStandGameAction(null, form({ intent: "delete" }));

    expect(state).toEqual({ status: "done", message: GAMES_COPY.standGame.outcomes.deleted });
    expect(await getPrisma().game.findUnique({ where: { standId: ids.stand } })).toBeNull();
    expect(await readImages(ids.stand)).toEqual([]);
    expect(listFiles()).toHaveLength(1);
    expect(await getPrisma().game.findUnique({ where: { standId: ids.otherStand } })).not.toBeNull();
    expect(await getPrisma().auditLog.count({ where: { action: "game.delete", entityId: game.id } })).toBe(1);
    expect(updateTag).toHaveBeenCalledWith("games");
  });

  it("does nothing without the confirmation of the form", async () => {
    expect(await deleteStandGameAction(null, form({}))).toEqual({
      status: "error",
      message: GAMES_COPY.standGame.errors.deleteNotConfirmed,
    });
    expect(await getPrisma().game.findUnique({ where: { standId: ids.stand } })).not.toBeNull();
  });

  it("ignores a game that the form names: it is the game of the stand of the session", async () => {
    const other = await getPrisma().game.findUniqueOrThrow({ where: { standId: ids.otherStand } });

    await deleteStandGameAction(null, form({ intent: "delete", gameId: other.id, standId: ids.otherStand }));

    expect(await getPrisma().game.findUnique({ where: { id: other.id } })).not.toBeNull();
    expect(await getPrisma().game.findUnique({ where: { standId: ids.stand } })).toBeNull();
  });

  it("answers that there is no game when the stand has none, and the staff cannot delete", async () => {
    await signInAs(ids.staff);
    await expect(deleteStandGameAction(null, form({ intent: "delete" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/stand/kiosk;"),
    });
    expect(await getPrisma().game.count()).toBe(2);

    await signInAs(ids.admin);
    await deleteStandGameAction(null, form({ intent: "delete" }));

    expect(await deleteStandGameAction(null, form({ intent: "delete" }))).toEqual({
      status: "error",
      message: GAMES_COPY.standGame.errors.noGame,
    });
  });

  it("is closed to the sysadmin session and to visitors", async () => {
    await signInAs(ids.sysadmin);
    await expect(deleteStandGameAction(null, form({ intent: "delete" }))).rejects.toMatchObject({
      digest: expect.stringContaining(";/login;"),
    });
    expect(await getPrisma().game.count()).toBe(2);
  });
});

async function upload(slot: string, bytes: Uint8Array) {
  const data = form({ slot });

  data.append("file", new File([Uint8Array.from(bytes)], "foto.jpg", { type: "image/jpeg" }));

  return uploadGameImageAction(null, data);
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();

  Object.entries(fields).forEach(([name, value]) => data.append(name, value));

  return data;
}

// Fills with spaces between the frame header and the end marker, so the file stays a valid JPEG of that exact size.
function padToSize(jpeg: Uint8Array, size: number): Uint8Array {
  const padded = new Uint8Array(size).fill(0x20);

  padded.set(jpeg.subarray(0, jpeg.length - 2), 0);
  padded.set([0xff, 0xd9], size - 2);

  return padded;
}

function pngBytes(): Uint8Array {
  return Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
}

function listFiles(): string[] {
  const directory = path.join(uploadsDirectory, "games");

  return existsSync(directory) ? readdirSync(directory).toSorted() : [];
}

async function readImages(standId: string) {
  return getPrisma().gameImage.findMany({
    where: { game: { standId } },
    orderBy: { position: "asc" },
    select: { path: true, alt: true, position: true, isCover: true },
  });
}

async function signInAs(accountId: string) {
  stubCookies(createCookieJar());
  await createSession(accountId);
}

async function createGame({ standId, slug, name }: { standId: string; slug: string; name: string }) {
  await getPrisma().game.create({
    data: {
      standId,
      slug,
      name,
      synopsis: "Una sinopsis.",
      genreId: ids.genre,
      images: { create: { path: GENERIC_COVER_PATH, alt: `Portada de ${name}`, position: 1, isCover: true } },
    },
  });
}

async function createStand(number: number) {
  return getPrisma().stand.create({ data: { zone: "A", number, studio: 1, groupCode: "101" } });
}

async function createAccount(account: { email: string; role: string; standId?: string }) {
  return getPrisma().account.create({
    data: { ...account, name: account.email, status: "active", password: "hash" },
  });
}
