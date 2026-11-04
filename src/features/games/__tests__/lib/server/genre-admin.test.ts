/**
 * @jest-environment node
 */
import { parseGenreInput } from "@features/games/lib/genre-input";
import { createGenre, deleteGenre, listAdminGenres, renameGenre } from "@features/games/lib/server/genre-admin";
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

function nameForm(name: string) {
  const form = new FormData();

  form.set("name", name);

  return form;
}

describe("the catalog of genres (RF-72)", () => {
  it("reads the name and builds its slug", () => {
    expect(parseGenreInput(nameForm("  Acción   y aventura "))).toEqual({
      isValid: true,
      name: "Acción y aventura",
      slug: "accion-y-aventura",
    });
    expect(parseGenreInput(nameForm("x"))).toEqual({ isValid: false });
    expect(parseGenreInput(nameForm("--"))).toEqual({ isValid: false });
  });

  it("creates, renames and refuses a repeated name", async () => {
    await expect(createGenre(actorId, { name: "Puzzle", slug: "puzzle" })).resolves.toEqual({ status: "saved" });
    await expect(createGenre(actorId, { name: "Puzzle", slug: "puzzle" })).resolves.toEqual({ status: "taken" });

    const [puzzle] = await listAdminGenres();

    await expect(renameGenre(actorId, puzzle.id, { name: "Rompecabezas", slug: "rompecabezas" })).resolves.toEqual({
      status: "saved",
    });
    await expect(renameGenre(actorId, "missing", { name: "Otro", slug: "otro" })).resolves.toEqual({
      status: "notFound",
    });
    await expect(listAdminGenres()).resolves.toEqual([
      { id: puzzle.id, name: "Rompecabezas", slug: "rompecabezas", gameCount: 0 },
    ]);
  });

  it("does not delete a genre with games and deletes one without them", async () => {
    const used = await getPrisma().genre.create({ data: { name: "Terror", slug: "terror" } });
    const unused = await getPrisma().genre.create({ data: { name: "Ritmo", slug: "ritmo" } });
    const stand = await getPrisma().stand.create({ data: { zone: "T", number: 1, studio: 1, groupCode: "101" } });

    await getPrisma().game.create({
      data: { standId: stand.id, name: "Susto", slug: "susto", synopsis: "Miedo.", genreId: used.id },
    });

    await expect(deleteGenre(actorId, used.id)).resolves.toEqual({ status: "hasGames" });
    await expect(deleteGenre(actorId, unused.id)).resolves.toEqual({ status: "deleted" });
    await expect(deleteGenre(actorId, unused.id)).resolves.toEqual({ status: "notFound" });
    await expect(getPrisma().genre.count({ where: { id: used.id } })).resolves.toBe(1);
    await expect(getPrisma().auditLog.count({ where: { action: "genre.delete" } })).resolves.toBe(1);
  });
});
