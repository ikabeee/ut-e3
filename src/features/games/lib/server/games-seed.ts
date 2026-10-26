import "server-only";
import type { StandLocation } from "@features/games/lib/stand-code";
import type { Game, GameImage, Genre } from "@features/games/lib/types";
import type { Prisma, PrismaClient } from "@generated/prisma/client";

const GENRES = {
  accion: { id: "accion", name: "Acción", slug: "accion" },
  aventura: { id: "aventura", name: "Aventura", slug: "aventura" },
  puzle: { id: "puzle", name: "Puzle", slug: "puzle" },
  carreras: { id: "carreras", name: "Carreras", slug: "carreras" },
  roguelike: { id: "roguelike", name: "Roguelike", slug: "roguelike" },
  simulacion: { id: "simulacion", name: "Simulación", slug: "simulacion" },
  ritmo: { id: "ritmo", name: "Ritmo", slug: "ritmo" },
  metroidvania: { id: "metroidvania", name: "Metroidvania", slug: "metroidvania" },
  estrategia: { id: "estrategia", name: "Estrategia", slug: "estrategia" },
  arcade: { id: "arcade", name: "Arcade", slug: "arcade" },
  plataformas: { id: "plataformas", name: "Plataformas", slug: "plataformas" },
  sigilo: { id: "sigilo", name: "Sigilo", slug: "sigilo" },
  pelea: { id: "pelea", name: "Pelea", slug: "pelea" },
} satisfies Record<string, Genre>;

type GameFields = Pick<Game, "slug" | "name" | "genre" | "synopsis" | "stand">;

// Sample studio and group, like the sample games, until the sysadmin registers the real stands (RF-39).
const SAMPLE_STAND_GROUP = { studio: 0, groupCode: "000" };

export const INITIAL_GAMES: Game[] = [
  buildGame({
    slug: "ceniza-protocol",
    name: "Ceniza Protocol",
    genre: GENRES.accion,
    synopsis: "Shooter de extracción en una ciudad sepultada por ceniza volcánica.",
    stand: { zone: "A", number: 1 },
  }),
  buildGame({
    slug: "los-ultimos-faros",
    name: "Los Últimos Faros",
    genre: GENRES.aventura,
    synopsis: "Mantén encendido el último faro del Caribe mientras la marea cambia la isla cada noche.",
    stand: { zone: "A", number: 2 },
  }),
  buildGame({
    slug: "hormigon",
    name: "Hormigón",
    genre: GENRES.puzle,
    synopsis: "Vierte, fragua y apila concreto para construir torres imposibles.",
    stand: { zone: "A", number: 3 },
  }),
  buildGame({
    slug: "ruta-9",
    name: "Ruta 9",
    genre: GENRES.carreras,
    synopsis: "Carreras arcade nocturnas sobre periféricos que nunca terminan.",
    stand: { zone: "B", number: 1 },
  }),
  buildGame({
    slug: "subsuelo",
    name: "Subsuelo",
    genre: GENRES.roguelike,
    synopsis: "Desciende por cenotes y galerías que cambian en cada partida.",
    stand: { zone: "B", number: 2 },
  }),
  buildGame({
    slug: "kaiju-mercado",
    name: "Kaiju Mercado",
    genre: GENRES.simulacion,
    synopsis: "Administra un tianguis donde los clientes miden treinta metros.",
    stand: { zone: "B", number: 3 },
  }),
  buildGame({
    slug: "eco-nulo",
    name: "Eco/Nulo",
    genre: GENRES.ritmo,
    synopsis: "Cada golpe en el ritmo borra una frecuencia del mapa.",
    stand: { zone: "C", number: 1 },
  }),
  buildGame({
    slug: "templo-404",
    name: "Templo 404",
    genre: GENRES.metroidvania,
    synopsis: "Explora un templo que se corrompe como un archivo dañado.",
    stand: { zone: "C", number: 2 },
  }),
  buildGame({
    slug: "marea-roja",
    name: "Marea Roja",
    genre: GENRES.estrategia,
    synopsis: "Defiende el arrecife de una marea tóxica colocando torres de coral.",
    stand: { zone: "C", number: 3 },
  }),
  buildGame({
    slug: "neon-taqueria",
    name: "Neón Taquería",
    genre: GENRES.arcade,
    synopsis: "Atiende pedidos imposibles en una taquería que nunca cierra.",
    stand: { zone: "D", number: 1 },
  }),
  buildGame({
    slug: "pulso-cero",
    name: "Pulso Cero",
    genre: GENRES.ritmo,
    synopsis: "Sincroniza tus saltos con el bajo para cruzar una ciudad apagada.",
    stand: { zone: "D", number: 2 },
  }),
  buildGame({
    slug: "xibalba-run",
    name: "Xibalbá Run",
    genre: GENRES.plataformas,
    synopsis: "Corre por el inframundo maya antes de que se cierre la última puerta.",
    stand: { zone: "D", number: 3 },
  }),
  buildGame({
    slug: "turbina",
    name: "Turbina",
    genre: GENRES.carreras,
    synopsis: "Carreras de drones caseros por los techos de Cancún.",
    stand: { zone: "T", number: 1 },
  }),
  buildGame({
    slug: "sombra-jade",
    name: "Sombra Jade",
    genre: GENRES.sigilo,
    synopsis: "Infíltrate en un museo para recuperar una máscara robada.",
    stand: { zone: "T", number: 2 },
  }),
  buildGame({
    slug: "granja-orbital",
    name: "Granja Orbital",
    genre: GENRES.simulacion,
    synopsis: "Cultiva nopales en gravedad cero y abastece una estación espacial.",
    stand: { zone: "T", number: 3 },
  }),
  buildGame({
    slug: "lucha-pixel",
    name: "Lucha Pixel",
    genre: GENRES.pelea,
    synopsis: "Lucha libre en 2D con llaves que se arman como combos.",
    stand: { zone: "T", number: 4 },
  }),
  buildGame({
    slug: "cenote",
    name: "Cenote",
    genre: GENRES.aventura,
    synopsis: "Explora cenotes inundados y descubre lo que guardan sus paredes.",
    stand: { zone: "T", number: 5 },
  }),
  buildGame({
    slug: "circuito-7",
    name: "Circuito 7",
    genre: GENRES.puzle,
    synopsis: "Conecta circuitos antes de que se acabe la batería del robot.",
    stand: { zone: "T", number: 6 },
  }),
];

function buildGame(fields: GameFields): Game {
  return {
    ...fields,
    id: fields.slug,
    images: [{ path: `/games/${fields.slug}.jpg`, alt: `Portada de ${fields.name}`, position: 1, isCover: true }],
    itchUrl: null,
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
  { slug, name, synopsis, itchUrl }: Game,
  links: { genreId: string; standId: string },
): Promise<string> {
  const game =
    (await prisma.game.findUnique({ where: { slug } })) ??
    (await prisma.game.create({ data: { slug, name, synopsis, itchUrl, ...links } }));

  return game.id;
}

async function findOrCreateImage(prisma: Prisma.TransactionClient, gameId: string, image: GameImage): Promise<void> {
  const existing = await prisma.gameImage.findUnique({
    where: { gameId_position: { gameId, position: image.position } },
  });

  if (!existing) await prisma.gameImage.create({ data: { ...image, gameId } });
}
