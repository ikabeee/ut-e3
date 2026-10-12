import type { AdminOption } from "@features/admin/lib/types";
import type { GameImageInput, GameImageRecord, GameRecord } from "@features/games/lib/types";
import type { Team } from "@features/teams/lib/types";

// Utilidades puras del panel: opciones de las listas, resúmenes y datos de las acciones.

/** Equipos, géneros o plataformas como opciones de un Select o de casillas. */
export function toAdminOptions(items: readonly { id: string; name: string }[]): AdminOption[] {
  return items.map((item) => ({ value: item.id, label: item.name }));
}

/** Un juego se muestra en el sitio sólo cuando tiene portada (ver `docs/data-model.md`). */
export function isGameVisible(game: Pick<GameRecord, "images">) {
  return game.images.some((image) => image.isCover);
}

export interface AdminSummary {
  teams: number;
  teamsWithStand: number;
  games: number;
  visibleGames: number;
  winners: number;
}

export function summarizeAdmin(
  teams: readonly Pick<Team, "standCode">[],
  games: readonly Pick<GameRecord, "images">[],
  winners: number,
): AdminSummary {
  return {
    teams: teams.length,
    teamsWithStand: teams.filter((team) => team.standCode !== null).length,
    games: games.length,
    visibleGames: games.filter(isGameVisible).length,
    winners,
  };
}

/** Datos para volver a guardar una foto como portada sin cambiar lo demás. */
export function toCoverImageInput(image: GameImageRecord) {
  return {
    imageUrl: image.imageUrl,
    altText: image.altText,
    cropPosition: image.cropPosition,
    sortOrder: image.sortOrder,
    isCover: true,
  } satisfies GameImageInput;
}

/** Siguiente posición libre de la galería (0-4) para una foto nueva. */
export function getNextImageSortOrder(images: readonly Pick<GameImageRecord, "sortOrder">[]) {
  const next = Math.max(-1, ...images.map((image) => image.sortOrder)) + 1;
  return Math.min(next, 4);
}

/** Zona horaria del evento (Cancún, UTC-5 todo el año): las horas del panel se muestran en ella. */
const EVENT_TIME_ZONE = "America/Cancun";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-MX", {
  timeZone: EVENT_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "2026-11-27T22:05:00Z" -> "27/11, 17:05" (hora del evento). */
export function formatAdminDateTime(isoDateTime: string) {
  return DATE_TIME_FORMAT.format(new Date(isoDateTime));
}
