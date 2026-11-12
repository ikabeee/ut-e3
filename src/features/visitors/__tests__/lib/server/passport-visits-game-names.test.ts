/**
 * @jest-environment node
 */
import { getPassportVisits } from "@features/visitors/lib/server/passport-visits-queries";
import { getPrisma } from "@shared/lib/server/prisma";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  await getPrisma().raffleTicket.deleteMany();
  await getPrisma().checkIn.deleteMany();
  await getPrisma().game.deleteMany();
  await getPrisma().visitor.deleteMany();
  await getPrisma().stand.deleteMany();
  await getPrisma().genre.deleteMany();
});

async function createVisitor(gamertag: string) {
  return getPrisma().visitor.create({
    data: {
      fullName: `Visitante ${gamertag}`,
      gamertag,
      email: `${gamertag}@example.com`,
      pin: `encrypted-${gamertag}`,
      pinLookup: `lookup-${gamertag}`,
    },
  });
}

async function createStandWithGame(zone: string, number: number, gameName: string) {
  const stand = await getPrisma().stand.create({ data: { zone, number, studio: 1, groupCode: "101" } });

  const genre = await getPrisma().genre.create({
    data: { name: `Género ${zone}${number}`, slug: `genero-s5-${zone}${number}` },
  });

  await getPrisma().game.create({
    data: {
      standId: stand.id,
      name: gameName,
      slug: `juego-s5-${zone}${number}`,
      synopsis: "Un juego de prueba.",
      genreId: genre.id,
    },
  });

  return stand;
}

// S5: the passport stand grid shows the game name under each stand code (audit H6-1). The query already owns the
// stands, so it also brings the name of the game of each stand.
describe("getPassportVisits game names (S5)", () => {
  it("returns the game name of each stand with its code", async () => {
    const visitor = await createVisitor("s5neo");

    await createStandWithGame("A", 1, "Pixel Quest");
    await createStandWithGame("A", 2, "Marea Neón");

    const result = await getPassportVisits(visitor.id);

    expect(result.stands).toEqual([
      { code: "ZA-S1", visited: false, gameName: "Pixel Quest" },
      { code: "ZA-S2", visited: false, gameName: "Marea Neón" },
    ]);
  });

  it("still lists every stand in zone and number order with its short code", async () => {
    const visitor = await createVisitor("s5trinity");

    await createStandWithGame("B", 1, "Juego B1");
    await createStandWithGame("A", 1, "Juego A1");

    const result = await getPassportVisits(visitor.id);

    expect(result.stands.map((stand) => stand.code)).toEqual(["ZA-S1", "ZB-S1"]);
  });
});
