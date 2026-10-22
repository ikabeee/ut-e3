import { EVENT_DYNAMICS } from "@features/event/lib/event-dynamics";
import { EVENT_INFO, EVENT_VENUE } from "@features/event/lib/event-info";
import { EVENT_REEL } from "@features/event/lib/event-media";
import {
  buildEventActivities,
  EVENT_HERO,
  EVENT_INTRO,
  EVENT_SCHEDULE,
  getScheduleHighlights,
} from "@features/event/lib/event-program";
import type { EventContent } from "@features/event/lib/types";

/**
 * Único punto de lectura del contenido del evento para las pages. Hoy devuelve las constantes
 * editables de `lib/`; si el contenido pasa a la base de datos, esta función se convierte en una
 * consulta cacheada en `lib/server/event-queries.ts` y los componentes no cambian, porque
 * reciben todo por props.
 */
export function getEventContent(): EventContent {
  const highlights = getScheduleHighlights(EVENT_SCHEDULE);

  return {
    info: EVENT_INFO,
    venue: EVENT_VENUE,
    hero: EVENT_HERO,
    intro: EVENT_INTRO,
    activities: buildEventActivities(highlights),
    schedule: EVENT_SCHEDULE,
    highlights,
    reel: EVENT_REEL,
    dynamics: EVENT_DYNAMICS,
  };
}
