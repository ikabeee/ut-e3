import { EVENT_INFO, EVENT_VENUE } from "@features/event/lib/event-info";
import { EVENT_REEL } from "@features/event/lib/event-media";
import { EVENT_ACTIVITIES, EVENT_HERO, EVENT_INTRO, EVENT_SCHEDULE } from "@features/event/lib/event-program";
import type { EventContent } from "@features/event/lib/types";

/**
 * Único punto de lectura del contenido del evento para las pages. Hoy devuelve las constantes
 * editables de `lib/`; si el contenido pasa a la base de datos, esta función se convierte en una
 * consulta cacheada en `lib/server/event-queries.ts` y los componentes no cambian, porque
 * reciben todo por props.
 */
export function getEventContent(): EventContent {
  return {
    info: EVENT_INFO,
    venue: EVENT_VENUE,
    hero: EVENT_HERO,
    intro: EVENT_INTRO,
    activities: EVENT_ACTIVITIES,
    schedule: EVENT_SCHEDULE,
    reel: EVENT_REEL,
  };
}
