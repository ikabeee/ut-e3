import "server-only";
import type { StandLocation } from "@features/games/lib/stand-code";
import type { Game, GameImage, Genre } from "@features/games/lib/types";
import type { Prisma, PrismaClient } from "@generated/prisma/client";

// The sources give no genre and no synopsis yet, so every game shares this placeholder genre.
const TO_BE_ANNOUNCED: Genre = { id: "por-anunciar", name: "Por anunciar", slug: "por-anunciar" };

type GameFields = Pick<Game, "slug" | "name" | "stand"> & { hasLandscapeImage?: boolean };

// Sample studio and group until the sysadmin registers the real stands (RF-39).
const SAMPLE_STAND_GROUP = { studio: 0, groupCode: "000" };

// The stands are provisional slots: the floor plan of the landing does not show them.
export const INITIAL_GAMES: Game[] = [
  buildGame({ slug: "abby-s-tower", name: "Abby's Tower", stand: { zone: "A", number: 1 } }),
  buildGame({ slug: "after-light", name: "After Light", stand: { zone: "A", number: 2 } }),
  buildGame({ slug: "astrolabio", name: "Astrolabio", stand: { zone: "A", number: 3 } }),
  buildGame({ slug: "carencia", name: "Carencia", stand: { zone: "B", number: 1 } }),
  buildGame({ slug: "dark-mutant", name: "Dark Mutant", stand: { zone: "B", number: 2 } }),
  buildGame({ slug: "echoscrap", name: "EchoScrap", stand: { zone: "B", number: 3 } }),
  buildGame({ slug: "identity-dissolution", name: "Identity Dissolution", stand: { zone: "C", number: 1 } }),
  buildGame({ slug: "laboratorio-4", name: "Laboratorio 4", stand: { zone: "C", number: 2 } }),
  buildGame({ slug: "reencarnacion-express", name: "Reencarnación Express", stand: { zone: "C", number: 3 } }),
  buildGame({ slug: "saatan-paal", name: "Saatan Paal", stand: { zone: "D", number: 1 } }),
  buildGame({ slug: "true-hero", name: "True Hero", stand: { zone: "D", number: 2 } }),
  buildGame({ slug: "turno-rosso", name: "Turno Rosso", stand: { zone: "D", number: 3 } }),
  buildGame({ slug: "unknown-game", name: "Unknown Game", stand: { zone: "T", number: 1 } }),
  // Its only artwork is the portrait cover.
  buildGame({ slug: "vaporlock", name: "Vaporlock", stand: { zone: "T", number: 2 }, hasLandscapeImage: false }),
];

function buildGame({ hasLandscapeImage = true, ...fields }: GameFields): Game {
  const cover: GameImage = {
    path: `/games/${fields.slug}.jpg`,
    alt: `Portada de ${fields.name}`,
    position: 1,
    isCover: true,
  };

  const landscape: GameImage = {
    path: `/games/${fields.slug}-portada.jpg`,
    alt: `Portada horizontal de ${fields.name}`,
    position: 2,
    isCover: false,
  };

  return {
    ...fields,
    id: fields.slug,
    genre: TO_BE_ANNOUNCED,
    synopsis: "",
    images: hasLandscapeImage ? [cover, landscape] : [cover],
  };
}

// Fills the catalog only while it has no games: once the sysadmin edits or deletes a game, a new seed leaves the
// catalog as it is instead of failing on a changed slug or cover, or bringing back a deleted game.
export async function seedGames(prisma: PrismaClient): Promise<void> {
  if ((await prisma.game.count()) > 0) return;

  // One transaction: a run that fails partway writes no game, so the next run still finds an empty catalog.
  await prisma.$transaction(async (transaction) => {
    for (const game of INITIAL_GAMES) await seedGame(transaction, game);
  });
}

async function seedGame(prisma: Prisma.TransactionClient, game: Game): Promise<void> {
  const genreId = await findOrCreateGenre(prisma, game.genre);
  const standId = await findOrCreateStand(prisma, game.stand);
  const gameId = await findOrCreateGame(prisma, game, { genreId, standId });

  for (const image of game.images) await findOrCreateImage(prisma, gameId, image);
}

async function findOrCreateGenre(prisma: Prisma.TransactionClient, { name, slug }: Genre): Promise<string> {
  const genre =
    (await prisma.genre.findUnique({ where: { slug } })) ?? (await prisma.genre.create({ data: { name, slug } }));

  return genre.id;
}

async function findOrCreateStand(prisma: Prisma.TransactionClient, location: StandLocation): Promise<string> {
  const stand =
    (await prisma.stand.findUnique({ where: { zone_number: location } })) ??
    (await prisma.stand.create({ data: { ...location, ...SAMPLE_STAND_GROUP } }));

  return stand.id;
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
