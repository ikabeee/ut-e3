/**
 * @jest-environment node
 */
import { createTestClient, createTestDatabase } from "@shared/__tests__/lib/server/test-database";

interface GameFields {
  standId: string;
  genreId: string;
  slug: string;
  itchUrl?: string | null;
}

const STAND_LIMIT = 18;

const SECURE_ITCH_URL = "https://ut.itch.io/ceniza-protocol";

const INSECURE_ITCH_URL = SECURE_ITCH_URL.replace("https:", "http:");

const database = createTestDatabase();

const prisma = createTestClient(database);

afterAll(async () => {
  await prisma.$disconnect();
  database.remove();
});

beforeEach(async () => {
  await prisma.gameImage.deleteMany();
  await prisma.game.deleteMany();
  await prisma.stand.deleteMany();
  await prisma.genre.deleteMany();
});

describe("stands table", () => {
  it("accepts the zones A, B, C, D and T and rejects any other zone", async () => {
    for (const zone of ["A", "B", "C", "D", "T"]) await createStand(zone, 1);

    await expect(createStand("E", 1)).rejects.toThrow();
    expect(await prisma.stand.count()).toBe(5);
  });

  it("accepts stand number 1 and rejects 0 or a negative number", async () => {
    await createStand("A", 1);

    await expect(createStand("A", 0)).rejects.toThrow();
    await expect(createStand("A", -1)).rejects.toThrow();
    expect(await prisma.stand.count()).toBe(1);
  });

  it("rejects a second stand with the same zone and number but accepts that number in another zone", async () => {
    await createStand("A", 3);

    await expect(createStand("A", 3)).rejects.toThrow();
    await expect(createStand("B", 3)).resolves.toBeDefined();
    expect(await prisma.stand.count()).toBe(2);
  });

  it("accepts the 18th stand and rejects the 19th", async () => {
    for (let number = 1; number <= STAND_LIMIT; number++) await createStand("A", number);

    await expect(createStand("A", STAND_LIMIT + 1)).rejects.toThrow();
    expect(await prisma.stand.count()).toBe(STAND_LIMIT);
  });
});

describe("games table", () => {
  it("rejects a second game for the same stand", async () => {
    const genre = await createGenre("accion");
    const stand = await createStand("A", 1);
    await createGame({ standId: stand.id, genreId: genre.id, slug: "ceniza-protocol" });

    await expect(createGame({ standId: stand.id, genreId: genre.id, slug: "hormigon" })).rejects.toThrow();
    expect(await prisma.game.count()).toBe(1);
  });

  it("rejects a second game with the same slug", async () => {
    const genre = await createGenre("accion");
    const firstStand = await createStand("A", 1);
    const secondStand = await createStand("A", 2);
    await createGame({ standId: firstStand.id, genreId: genre.id, slug: "hormigon" });

    await expect(createGame({ standId: secondStand.id, genreId: genre.id, slug: "hormigon" })).rejects.toThrow();
    await expect(createGame({ standId: secondStand.id, genreId: genre.id, slug: "faros" })).resolves.toBeDefined();
    expect(await prisma.game.count()).toBe(2);
  });

  it("keeps a genre that a game uses and deletes one that no game uses", async () => {
    const usedGenre = await createGenre("accion");
    const unusedGenre = await createGenre("puzle");
    const stand = await createStand("A", 1);
    await createGame({ standId: stand.id, genreId: usedGenre.id, slug: "ceniza-protocol" });

    await expect(prisma.genre.delete({ where: { id: usedGenre.id } })).rejects.toThrow();
    await expect(prisma.genre.delete({ where: { id: unusedGenre.id } })).resolves.toBeDefined();
    expect(await prisma.genre.findMany({ select: { slug: true } })).toEqual([{ slug: "accion" }]);
  });

  it("accepts an https itch.io link or none and rejects an http link", async () => {
    const genre = await createGenre("accion");
    const secureStand = await createStand("A", 1);
    const unlinkedStand = await createStand("A", 2);
    const insecureStand = await createStand("A", 3);
    await createGame({ standId: secureStand.id, genreId: genre.id, slug: "a", itchUrl: SECURE_ITCH_URL });
    await createGame({ standId: unlinkedStand.id, genreId: genre.id, slug: "b", itchUrl: null });

    const insecureGame = { standId: insecureStand.id, genreId: genre.id, slug: "c", itchUrl: INSECURE_ITCH_URL };

    await expect(createGame(insecureGame)).rejects.toThrow();
    expect(await prisma.game.count()).toBe(2);
  });
});

describe("game_images table", () => {
  it("accepts positions 1 to 5 and rejects a sixth image or a repeated position", async () => {
    const gameId = await createSampleGame();

    for (let position = 1; position <= 5; position++) await createImage(gameId, position, position === 1);

    await expect(createImage(gameId, 6, false)).rejects.toThrow();
    await expect(createImage(gameId, 3, false)).rejects.toThrow();
    expect(await prisma.gameImage.count()).toBe(5);
  });

  it("rejects position 0 and keeps the images unchanged", async () => {
    const gameId = await createSampleGame();
    await createImage(gameId, 1, true);

    await expect(createImage(gameId, 0, false)).rejects.toThrow();
    expect(await prisma.gameImage.count()).toBe(1);
  });

  it("rejects a second cover for the same game but accepts more images that are not covers", async () => {
    const gameId = await createSampleGame();
    await createImage(gameId, 1, true);

    await expect(createImage(gameId, 2, true)).rejects.toThrow();
    await expect(createImage(gameId, 2, false)).resolves.toBeDefined();
    await expect(createImage(gameId, 3, false)).resolves.toBeDefined();
    expect(await prisma.gameImage.count({ where: { gameId, isCover: true } })).toBe(1);
  });
});

async function createSampleGame(): Promise<string> {
  const genre = await createGenre("accion");
  const stand = await createStand("A", 1);
  const game = await createGame({ standId: stand.id, genreId: genre.id, slug: "ceniza-protocol" });

  return game.id;
}

function createGenre(slug: string) {
  return prisma.genre.create({ data: { name: slug, slug } });
}

function createStand(zone: string, number: number) {
  return prisma.stand.create({ data: { zone, number, studio: 4, groupCode: "103" } });
}

function createGame(fields: GameFields) {
  return prisma.game.create({
    data: { name: fields.slug, synopsis: "Juego de prueba.", ...fields },
  });
}

function createImage(gameId: string, position: number, isCover: boolean) {
  return prisma.gameImage.create({
    data: { gameId, position, isCover, path: `/games/ceniza-protocol/${position}.webp`, alt: "Captura del juego" },
  });
}
