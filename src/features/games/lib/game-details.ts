import type { Game } from "@features/games/lib/types";

/** Pasillo del stand: la letra del código ("B7" -> "B"). */
export function getStandAisle(stand: string) {
  return stand.charAt(0);
}

/** Etiquetas de "Características" del detalle. */
export function getGameFeatures(game: Game) {
  return ["Demo jugable", "Un jugador", ...(game.hasTournament ? ["Competitivo"] : [])];
}

/** Párrafos de "Acerca del juego". */
export function describeGame(game: Game) {
  const paragraphs = [
    `${game.name} es el proyecto de ${game.team}, ${game.members} estudiantes de la División de Ingeniería y Tecnologías de la UT Cancún. En el evento vas a poder jugar una demo de unos 10 minutos y platicar con el equipo sobre cómo lo hicieron.`,
  ];
  if (game.hasTournament) {
    paragraphs.push(
      "Este juego tiene torneo. Inscríbete en la Arena antes de las 12:00; las finales se juegan en el main stage a las 17:00.",
    );
  }
  return paragraphs;
}

export interface GameFact {
  label: string;
  value: string;
}

/** Ficha lateral del juego. */
export function getGameFacts(game: Game, eventDateLabel: string): GameFact[] {
  return [
    { label: "Equipo", value: game.team.replace(/^Equipo /, "") },
    { label: "Integrantes", value: String(game.members) },
    { label: "Género", value: game.genre },
    { label: "Stand", value: game.stand },
    { label: "Torneo", value: game.hasTournament ? "Sí" : "No" },
    { label: "Evento", value: eventDateLabel },
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
