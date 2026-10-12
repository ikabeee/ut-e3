import type { ScheduleHighlights } from "@features/event/lib/types";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

/** Pasillo del stand: la letra del código ("B7" -> "B"). */
export function getStandAisle(stand: string) {
  return stand.charAt(0);
}

/** Etiquetas de "Características" del detalle. */
export function getGameFeatures(game: Game) {
  const { features } = GAMES_COPY;
  return [features.demo, features.players(game.players), ...(game.hasTournament ? [features.competitive] : [])];
}

/** Horarios del programa del evento que cita el detalle de un juego. */
export type GameScheduleTimes = Pick<ScheduleHighlights, "tournamentSignupDeadline" | "tournamentFinalsAt">;

/**
 * Párrafos de "Acerca del juego": los del juego o, si no trae, el texto genérico; más el aviso
 * de torneo con los horarios del programa (`schedule`, que pasa la page desde `event`).
 */
export function describeGame(game: Game, schedule: GameScheduleTimes) {
  const paragraphs = game.about ? [...game.about] : [GAMES_COPY.detail.about(game)];
  if (game.hasTournament) {
    paragraphs.push(GAMES_COPY.detail.tournamentNote(schedule));
  }
  return paragraphs;
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
    { label: facts.stand, value: game.stand },
    { label: facts.tournament, value: game.hasTournament ? facts.yes : facts.no },
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
