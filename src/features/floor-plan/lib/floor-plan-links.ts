/** Ruta del croquis interactivo. */
export const FLOOR_PLAN_PATH = "/floor-plan";

/** Stand o zona en el croquis interactivo: `/floor-plan#A1`, `/floor-plan#stage`. */
export function getPlanItemPath(id: string) {
  return `${FLOOR_PLAN_PATH}#${id}`;
}
