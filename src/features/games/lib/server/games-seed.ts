import "server-only";
import type { AdminStandLocation, StandLocation } from "@features/games/lib/stand-code";
import type { Game, GameImage, Genre } from "@features/games/lib/types";
import type { Prisma, PrismaClient } from "@generated/prisma/client";

// The sources give no synopsis yet. A genre is required by the model, so a game whose genre is not confirmed (Make 'em
// Fall) and the ones that are added later use this placeholder genre.
export const TO_BE_ANNOUNCED: Genre = { id: "por-anunciar", name: "Por anunciar", slug: "por-anunciar" };

const PLATFORMS_3D: Genre = { id: "plataformas-3d", name: "Plataformas 3D", slug: "plataformas-3d" };

// One name per genre: "Plataformas" (not "Plataforma") and "RPG" (not "Rol (RPG)"). The slug is the one that the admin
// builds from the name, so the sysadmin's own genres with the same name are reused.
const GENRES = {
  action: { id: "accion", name: "Acción", slug: "accion" },
  horror: { id: "terror", name: "Terror", slug: "terror" },
  platforms: { id: "plataformas", name: "Plataformas", slug: "plataformas" },
  survivalHorror: { id: "survival-horror", name: "Survival Horror", slug: "survival-horror" },
  stealth: { id: "sigilo", name: "Sigilo", slug: "sigilo" },
  rpg: { id: "rpg", name: "RPG", slug: "rpg" },
  simulation: { id: "simulacion", name: "Simulación", slug: "simulacion" },
  roguelike: { id: "roguelike", name: "Roguelike", slug: "roguelike" },
} satisfies Record<string, Genre>;

// The genre of each game, as the organizers confirmed it. DON'T PET ME keeps its own (Plataformas 3D) in SEED_GAMES.
const GENRE_BY_SLUG = new Map<string, Genre>([
  ["abby-s-tower", GENRES.action],
  ["carencia", GENRES.horror],
  ["true-hero", GENRES.platforms],
  ["unknown-game", GENRES.platforms],
  ["astrolabio", GENRES.platforms],
  ["identity-dissolution", GENRES.survivalHorror],
  ["dark-mutant", GENRES.survivalHorror],
  ["saatan-paal", GENRES.stealth],
  ["one-mind", GENRES.action],
  ["vaporlock", GENRES.action],
  ["sombra-del-mictlan", GENRES.rpg],
  ["reencarnacion-express", GENRES.rpg],
  ["turno-rosso", GENRES.simulation],
  ["after-light", GENRES.roguelike],
  ["echoscrap", GENRES.roguelike],
  ["laboratorio-4", GENRES.roguelike],
]);

interface SeedGame {
  slug: string;
  name: string;
  stand: StandLocation;
  studio: number;
  groupCode: string;
  /** False for the games that have no artwork yet: they show a generic cover with their name. */
  hasCover?: boolean;
  /** False for the games whose only artwork is the portrait cover. */
  hasLandscapeImage?: boolean;
  /** Overrides GENRE_BY_SLUG; without either, the placeholder genre. */
  genre?: Genre;
}

// The 18 stands of the event, by zone and number: studio and group as the organizers assigned them.
const SEED_GAMES: SeedGame[] = [
  {
    slug: "make-em-fall",
    name: "Make 'em Fall",
    stand: { zone: "A", number: 1 },
    studio: 6,
    groupCode: "101",
    hasCover: false,
  },
  { slug: "true-hero", name: "True Hero", stand: { zone: "A", number: 2 }, studio: 5, groupCode: "102" },
  { slug: "laboratorio-4", name: "Laboratorio 4", stand: { zone: "A", number: 3 }, studio: 4, groupCode: "103" },
  { slug: "abby-s-tower", name: "Abby's Tower", stand: { zone: "B", number: 1 }, studio: 2, groupCode: "103" },
  { slug: "one-mind", name: "One Mind", stand: { zone: "B", number: 2 }, studio: 4, groupCode: "101", hasCover: false },
  {
    slug: "vaporlock",
    name: "Vaporlock",
    stand: { zone: "B", number: 3 },
    studio: 3,
    groupCode: "103",
    hasLandscapeImage: false,
  },
  { slug: "unknown-game", name: "Unknown Game", stand: { zone: "C", number: 1 }, studio: 6, groupCode: "103" },
  {
    slug: "sombra-del-mictlan",
    name: "Sombra del Mictlán",
    stand: { zone: "C", number: 2 },
    studio: 1,
    groupCode: "101",
    hasCover: false,
  },
  {
    slug: "don-t-pet-me",
    name: "DON'T PET ME",
    stand: { zone: "C", number: 3 },
    studio: 5,
    groupCode: "101",
    genre: PLATFORMS_3D,
  },
  { slug: "turno-rosso", name: "Turno Rosso", stand: { zone: "D", number: 1 }, studio: 2, groupCode: "102" },
  {
    slug: "reencarnacion-express",
    name: "Reencarnación Express",
    stand: { zone: "D", number: 2 },
    studio: 5,
    groupCode: "103",
  },
  { slug: "astrolabio", name: "Astrolabio", stand: { zone: "D", number: 3 }, studio: 1, groupCode: "103" },
  { slug: "echoscrap", name: "EchoScrap", stand: { zone: "T", number: 1 }, studio: 6, groupCode: "102" },
  { slug: "after-light", name: "After Light", stand: { zone: "T", number: 2 }, studio: 1, groupCode: "102" },
  { slug: "dark-mutant", name: "Dark Mutant", stand: { zone: "T", number: 3 }, studio: 4, groupCode: "102" },
  { slug: "saatan-paal", name: "Saatan Paal", stand: { zone: "T", number: 4 }, studio: 3, groupCode: "102" },
  { slug: "carencia", name: "Carencia", stand: { zone: "T", number: 5 }, studio: 3, groupCode: "101" },
  {
    slug: "identity-dissolution",
    name: "Identity Dissolution",
    stand: { zone: "T", number: 6 },
    studio: 2,
    groupCode: "101",
  },
];

export const INITIAL_GAMES: Game[] = SEED_GAMES.map(buildGame);

/** The stand of each game with its studio and group, like `ZA-S3-E4-103` once formatted (RF-11). */
export const INITIAL_STANDS: AdminStandLocation[] = SEED_GAMES.map(({ stand, studio, groupCode }) => ({
  ...stand,
  studio,
  groupCode,
}));

function buildGame({
  hasCover = true,
  hasLandscapeImage = true,
  slug,
  genre = GENRE_BY_SLUG.get(slug) ?? TO_BE_ANNOUNCED,
  name,
  stand,
}: SeedGame): Game {
  const cover: GameImage = {
    path: `/games/${slug}.jpg`,
    alt: `Portada de ${name}`,
    position: 1,
    isCover: true,
  };

  const landscape: GameImage = {
    path: `/games/${slug}-portada.jpg`,
    alt: `Portada horizontal de ${name}`,
    position: 2,
    isCover: false,
  };

  return {
    id: slug,
    slug,
    name,
    stand,
    genre,
    synopsis: "",
    images: [hasCover ? cover : null, hasCover && hasLandscapeImage ? landscape : null].filter(isImage),
  };
}

function isImage(image: GameImage | null): image is GameImage {
  return image !== null;
}

// Fills the catalog only while it has no games: once the sysadmin edits or deletes a game, a new seed leaves the
// catalog as it is instead of failing on a changed slug or cover, or bringing back a deleted game.
export async function seedGames(prisma: PrismaClient): Promise<void> {
  if ((await prisma.game.count()) > 0) return;

  // One transaction: a run that fails partway writes no game, so the next run still finds an empty catalog.
  await prisma.$transaction(async (transaction) => {
    for (const [index, game] of INITIAL_GAMES.entries()) await seedGame(transaction, game, INITIAL_STANDS[index]);
  });
}

async function seedGame(prisma: Prisma.TransactionClient, game: Game, stand: AdminStandLocation): Promise<void> {
  const genreId = await findOrCreateGenre(prisma, game.genre);
  const standId = await findOrCreateStand(prisma, stand);
  const gameId = await findOrCreateGame(prisma, game, { genreId, standId });

  for (const image of game.images) await findOrCreateImage(prisma, gameId, image);
}

async function findOrCreateGenre(prisma: Prisma.TransactionClient, { name, slug }: Genre): Promise<string> {
  const genre =
    (await prisma.genre.findUnique({ where: { slug } })) ?? (await prisma.genre.create({ data: { name, slug } }));

  return genre.id;
}

async function findOrCreateStand(prisma: Prisma.TransactionClient, stand: AdminStandLocation): Promise<string> {
  const row =
    (await prisma.stand.findUnique({ where: { zone_number: { zone: stand.zone, number: stand.number } } })) ??
    (await prisma.stand.create({ data: stand }));

  return row.id;
}

async function findOrCreateGame(
  prisma: Prisma.TransactionClient,
  { slug, name, synopsis }: Game,
  links: { genreId: string; standId: string },
): Promise<string> {
  const game =
    (await prisma.game.findUnique({ where: { slug } })) ??
    (await prisma.game.create({ data: { slug, name, synopsis, ...links } }));

  return game.id;
}

async function findOrCreateImage(prisma: Prisma.TransactionClient, gameId: string, image: GameImage): Promise<void> {
  const existing = await prisma.gameImage.findUnique({
    where: { gameId_position: { gameId, position: image.position } },
  });

  if (!existing) await prisma.gameImage.create({ data: { ...image, gameId } });
}
