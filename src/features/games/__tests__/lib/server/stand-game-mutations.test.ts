/**
 * @jest-environment node
 */
import { GENERIC_COVER_PATH } from "@features/games/lib/game-cover";
import { saveStandGame } from "@features/games/lib/server/stand-game-mutations";
import { getStandGame, listGenres } from "@features/games/lib/server/stand-game-queries";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

const ids = { actorA: "", actorB: "", standA: "", standB: "", action: "", puzzle: "" };

beforeAll(async () => {
  ids.standA = (await createStand(1)).id;
  ids.standB = (await createStand(2)).id;
  ids.actorA = (await createAdmin("a@ut.mx", ids.standA)).id;
  ids.actorB = (await createAdmin("b@ut.mx", ids.standB)).id;
  ids.action = (await getPrisma().genre.create({ data: { name: "Acción", slug: "accion" } })).id;
  ids.puzzle = (await getPrisma().genre.create({ data: { name: "Puzle", slug: "puzle" } })).id;
});

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().gameImage.deleteMany();
  await getPrisma().game.deleteMany();
});

describe("saveStandGame (RF-31)", () => {
  it("registers the game of the stand with the generic cover and audits it", async () => {
    const result = await saveStandGame({ actor: actorOf("A"), input: input("Ruta Nueve") });

    expect(result).toEqual({ status: "created" });

    const game = await getPrisma().game.findUniqueOrThrow({
      where: { standId: ids.standA },
      include: { images: true },
    });

    const entry = await getPrisma().auditLog.findFirstOrThrow({ where: { action: "game.create", entityId: game.id } });

    expect(game).toMatchObject({ name: "Ruta Nueve", slug: "ruta-nueve", genreId: ids.action, itchUrl: null });
    expect(game.images).toEqual([
      expect.objectContaining({ path: GENERIC_COVER_PATH, isCover: true, position: 1, alt: "Portada de Ruta Nueve" }),
    ]);
    expect(entry).toMatchObject({ actorId: ids.actorA, entityType: "game" });
    expect(entry.detail).toEqual({ standId: ids.standA });
  });

  it("updates the game it already has, keeps its slug and audits the change", async () => {
    await saveStandGame({ actor: actorOf("A"), input: input("Ruta Nueve") });

    const result = await saveStandGame({
      actor: actorOf("A"),
      input: { ...input("Ruta Diez"), genreId: ids.puzzle, itchUrl: "https://studio.itch.io/ruta" },
    });

    const game = await getPrisma().game.findUniqueOrThrow({
      where: { standId: ids.standA },
      include: { images: true },
    });

    expect(result).toEqual({ status: "updated" });
    expect(await getPrisma().game.count({ where: { standId: ids.standA } })).toBe(1);
    expect(game).toMatchObject({ name: "Ruta Diez", slug: "ruta-nueve", genreId: ids.puzzle });
    expect(game.itchUrl).toBe("https://studio.itch.io/ruta");
    expect(game.images[0].alt).toBe("Portada de Ruta Diez");
    expect(await getPrisma().auditLog.count({ where: { action: "game.update", entityId: game.id } })).toBe(1);
  });

  it("does not touch the cover that the sysadmin loaded", async () => {
    await saveStandGame({ actor: actorOf("A"), input: input("Ruta Nueve") });
    await getPrisma().gameImage.updateMany({ data: { path: "/games/ruta-9.jpg", alt: "Portada real" } });

    await saveStandGame({ actor: actorOf("A"), input: input("Ruta Diez") });

    expect(await getPrisma().gameImage.findFirstOrThrow()).toMatchObject({
      path: "/games/ruta-9.jpg",
      alt: "Portada real",
    });
  });

  it("only changes the game of the stand of the actor", async () => {
    await saveStandGame({ actor: actorOf("A"), input: input("Juego de A") });
    await saveStandGame({ actor: actorOf("B"), input: input("Juego de B") });
    await saveStandGame({ actor: actorOf("B"), input: input("Juego de B editado") });

    expect((await getStandGame(ids.standA))?.name).toBe("Juego de A");
    expect((await getStandGame(ids.standB))?.name).toBe("Juego de B editado");
    expect(await getPrisma().game.count()).toBe(2);
  });

  it("gives a repeated name a slug that is free", async () => {
    await saveStandGame({ actor: actorOf("A"), input: input("Ruta 9") });
    await saveStandGame({ actor: actorOf("B"), input: input("Ruta 9") });

    const slugs = (await getPrisma().game.findMany({ select: { slug: true } })).map((game) => game.slug);

    expect(slugs.toSorted()).toEqual(["ruta-9", "ruta-9-2"]);
  });

  it("refuses a genre that does not exist and writes nothing", async () => {
    const entriesBefore = await getPrisma().auditLog.count();

    const result = await saveStandGame({ actor: actorOf("A"), input: { ...input("Ruta"), genreId: "missing" } });

    expect(result).toEqual({ status: "invalidGenre" });
    expect(await getPrisma().game.count()).toBe(0);
    expect(await getPrisma().auditLog.count()).toBe(entriesBefore);
  });
});

describe("the queries of the stand game form", () => {
  it("answers null while the stand has no game (RF-34)", async () => {
    expect(await getStandGame(ids.standA)).toBeNull();
  });

  it("lists the genres by name", async () => {
    expect((await listGenres()).map((genre) => genre.name)).toEqual(["Acción", "Puzle"]);
  });
});

function actorOf(stand: "A" | "B") {
  return stand === "A" ? { id: ids.actorA, standId: ids.standA } : { id: ids.actorB, standId: ids.standB };
}

function input(name: string) {
  return { name, synopsis: "Una sinopsis.", genreId: ids.action, itchUrl: null };
}

async function createStand(number: number) {
  return getPrisma().stand.create({ data: { zone: "A", number, studio: 1, groupCode: "101" } });
}

async function createAdmin(email: string, standId: string) {
  return getPrisma().account.create({
    data: { email, name: email, role: "stand_admin", status: "active", password: "hash", standId },
  });
}
