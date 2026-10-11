import type { LocatedScheduleEntry, ScheduleEntry } from "@features/event/lib/types";
import type { PlanZone, ZoneId } from "@features/floor-plan/lib/types";

type PlanZones = Readonly<Record<ZoneId, PlanZone>>;

function isZoneId(zones: PlanZones, id: string): id is ZoneId {
  return Object.hasOwn(zones, id);
}

/**
 * Une cada renglón del programa con su zona del croquis. `event` no puede importar `floor-plan`
 * (cerraría un ciclo con `games`), así que la relación se resuelve aquí, en la portada, que
 * compone las dos features.
 *
 * Si un `zoneId` no existe en el croquis, lanza un error: el prerender de la portada falla en el
 * build en lugar de publicar un botón del programa que no lleva a ninguna zona.
 */
export function resolveScheduleZones(schedule: readonly ScheduleEntry[], zones: PlanZones): LocatedScheduleEntry[] {
  return schedule.map((entry) => {
    if (!isZoneId(zones, entry.zoneId)) {
      throw new Error(
        `El programa enlaza "${entry.title}" con la zona "${entry.zoneId}", que no existe en el croquis (PLAN_ZONES en floor-plan/lib/plan-places.ts).`,
      );
    }
    return { ...entry, zoneTitle: zones[entry.zoneId].title };
  });
}
