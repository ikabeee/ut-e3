import type { Game, GameImage } from "@features/games/lib/types";

const GENRES = [
  { id: "action", name: "Acción", slug: "action" },
  { id: "puzzle", name: "Puzle", slug: "puzzle" },
  { id: "racing", name: "Carreras", slug: "racing" },
];

type GameOverrides = Partial<Game> & Pick<Game, "id" | "name">;

export function makeGames(count: number): Game[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return makeGame({
      id: `juego-${number}`,
      name: `Juego ${number}`,
      genre: GENRES[index % GENRES.length],
      stand: { zone: "A", number: index + 1 },
    });
  });
}

export function makeGame(overrides: GameOverrides): Game {
  const cover: GameImage = {
    path: `/games/${overrides.id}.jpg`,
    alt: `Portada de ${overrides.name}`,
    position: 0,
    isCover: true,
  };

  return {
    slug: overrides.id,
    synopsis: `${overrides.name}, juego de prueba.`,
    genre: GENRES[0],
    stand: { zone: "A", number: 1 },
    images: [cover],
    itchUrl: null,
    ...overrides,
  };
}
