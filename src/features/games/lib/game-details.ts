import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

/** Código del stand o "Por asignar" mientras el equipo no tiene stand. */
export function formatStand(stand: string | null) {
  return stand ?? GAMES_COPY.unassignedStand;
}

/** Pasillo del stand: la letra del código ("B7" -> "B"); "Por asignar" si no tiene stand. */
export function getStandAisle(stand: string | null) {
  return stand ? stand.charAt(0) : GAMES_COPY.unassignedStand;
}

/** Etiquetas de "Características" del detalle: la demo, los jugadores y las plataformas. */
export function getGameFeatures(game: Game) {
  const { features } = GAMES_COPY;
  return [features.demo, features.players(game.players), ...game.platforms];
}

/** Párrafos de "Acerca del juego": los del juego o, si no trae, el texto genérico. */
export function describeGame(game: Game) {
  return game.about ? [...game.about] : [GAMES_COPY.detail.about(game)];
}

export interface GameFact {
  label: string;
  value: string;
}

/** Ficha lateral del juego. */
export function getGameFacts(game: Game, eventDateLabel: string): GameFact[] {
  const { facts } = GAMES_COPY;
  return [
    { label: facts.team, value: game.team.replace(/^Equipo /, "") },
    { label: facts.members, value: String(game.members) },
    { label: facts.genre, value: game.genre },
    { label: facts.stand, value: formatStand(game.stand) },
    { label: facts.event, value: eventDateLabel },
  ];
}

/**
 * "Más juegos": primero los del mismo género y después los más cercanos en el orden del
 * catálogo (de forma circular), sin incluir el juego actual.
 */
export function getRelatedGames(games: readonly Game[], current: Game, limit = 5) {
  const currentIndex = games.findIndex((game) => game.slug === current.slug);
  const distance = (index: number) => (index - currentIndex + games.length) % games.length;

  return games
    .map((game, index) => ({ game, index }))
    .filter(({ game }) => game.slug !== current.slug)
    .sort(
      (a, b) =>
        Number(b.game.genre === current.genre) - Number(a.game.genre === current.genre) ||
        distance(a.index) - distance(b.index),
    )
    .slice(0, limit)
    .map(({ game }) => game);
}
