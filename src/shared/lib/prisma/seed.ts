/**
 * Datos de ejemplo para desarrollo: géneros, plataformas y los 18 equipos con su juego,
 * integrantes, plataformas y portada (`seed-data.json`).
 *
 * Uso: `npm run db:seed`, después de `npm run db:migrate`. Es idempotente: lo que ya existe
 * (por slug, nombre o posición) no se duplica ni se modifica.
 *
 * Corre con Node, que ejecuta TypeScript directamente, fuera de Next.js. Por eso crea su
 * propio cliente en lugar de importar `db.ts` (que es `server-only`) y usa rutas `./`.
 */
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };
import seedJson from "./seed-data.json" with { type: "json" };

type StudentGroup = "IDYGS101" | "IDYGS102" | "IDYGS103";

interface SeedData {
  genres: { slug: string; name: string }[];
  platforms: { slug: string; name: string }[];
  teams: {
    name: string;
    standCode: string | null;
    members: { fullName: string; groupName: StudentGroup; isLeader: boolean }[];
    game: {
      slug: string;
      name: string;
      description: string;
      genre: string;
      platforms: string[];
      itchioUrl: string | null;
      cover: { imageUrl: string; altText: string; cropPosition: string | null };
    };
  }[];
}

const seedData = seedJson as SeedData;

const skipOn = <Field extends string>(...conflictOn: Field[]) => ({ onConflict: "skip" as const, conflictOn });

const db = postgres<Contract>({ contractJson, url: process.env["DATABASE_URL"]! });

/** Hash con el que se guardan las llaves de los escáneres (nunca la llave). */
function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

async function seedCatalogLookups() {
  await db.orm.public.Genre.createAll(seedData.genres, skipOn("slug"));
  await db.orm.public.Platform.createAll(seedData.platforms, skipOn("slug"));

  const genres = await db.orm.public.Genre.select("id", "slug").all();
  const platforms = await db.orm.public.Platform.select("id", "slug").all();

  return {
    genreIds: new Map(genres.map((genre) => [genre.slug, genre.id])),
    platformIds: new Map(platforms.map((platform) => [platform.slug, platform.id])),
  };
}

/** Crea los equipos que faltan y devuelve las llaves de escáner de los nuevos. */
async function seedTeams() {
  const scannerKeys = new Map(seedData.teams.map((team) => [team.name, randomBytes(16).toString("hex")]));

  const created = await db.orm.public.Team.createAll(
    seedData.teams.map((team) => ({
      name: team.name,
      standCode: team.standCode,
      scannerKeyHash: hashSecret(scannerKeys.get(team.name)!),
    })),
    skipOn("name"),
  );

  const teams = await db.orm.public.Team.select("id", "name").all();

  const teamsWithMembers = new Set(
    (await db.orm.public.TeamMember.select("teamId").all()).map((member) => member.teamId),
  );

  const teamIds = new Map(teams.map((team) => [team.name, team.id]));

  const members = seedData.teams.flatMap((team) => {
    const teamId = teamIds.get(team.name)!;

    if (teamsWithMembers.has(teamId)) return [];

    return team.members.map((member, index) => ({ ...member, teamId, sortOrder: index }));
  });

  if (members.length > 0) {
    await db.orm.public.TeamMember.createAll(members);
  }

  return {
    teamIds,
    newScannerKeys: created.map((team) => ({ team: team.name, key: scannerKeys.get(team.name)! })),
  };
}

async function seedGames(
  teamIds: Map<string, string>,
  genreIds: Map<string, string>,
  platformIds: Map<string, string>,
) {
  await db.orm.public.Game.createAll(
    seedData.teams.map(({ name, game }, index) => ({
      teamId: teamIds.get(name)!,
      genreId: genreIds.get(game.genre)!,
      slug: game.slug,
      name: game.name,
      description: game.description,
      itchioUrl: game.itchioUrl,
      sortOrder: index,
    })),
    skipOn("slug"),
  );

  const games = await db.orm.public.Game.select("id", "slug").all();
  const gameIds = new Map(games.map((game) => [game.slug, game.id]));

  await db.orm.public.GamePlatform.createAll(
    seedData.teams.flatMap(({ game }) =>
      game.platforms.map((platform) => ({ gameId: gameIds.get(game.slug)!, platformId: platformIds.get(platform)! })),
    ),
    skipOn("gameId", "platformId"),
  );

  await db.orm.public.GameImage.createAll(
    seedData.teams.map(({ game }) => ({
      gameId: gameIds.get(game.slug)!,
      imageUrl: game.cover.imageUrl,
      altText: game.cover.altText,
      cropPosition: game.cover.cropPosition,
      isCover: true,
      sortOrder: 0,
    })),
    skipOn("gameId", "sortOrder"),
  );

  return games.length;
}

async function main() {
  const { genreIds, platformIds } = await seedCatalogLookups();
  const { teamIds, newScannerKeys } = await seedTeams();
  const gameCount = await seedGames(teamIds, genreIds, platformIds);

  console.log(`Seeds listos: ${genreIds.size} géneros, ${platformIds.size} plataformas, ${gameCount} juegos.`);

  if (newScannerKeys.length > 0) {
    console.log("\nLlaves de escáner de los equipos nuevos (sólo se muestran una vez; la base guarda su hash):");
    console.table(newScannerKeys);
  }
}

try {
  await main();
} finally {
  await db.close();
}
