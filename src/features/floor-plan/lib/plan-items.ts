import { INFO_STANDS, PLAN_CATEGORIES, PLAN_ZONES } from "@features/floor-plan/lib/plan-places";
import type { PlanCategory, PlanItem, ZoneId } from "@features/floor-plan/lib/types";
import type { Game } from "@features/games/lib/types";

/**
 * Todo lo seleccionable del croquis, en el orden del directorio: stands de equipo (en el
 * orden del catálogo), stands informativos y zonas.
 */
export function buildPlanItems(games: readonly Game[]): PlanItem[] {
  const teamStands = games.map(
    (game): PlanItem => ({
      id: game.stand,
      category: "team",
      code: game.stand,
      title: game.name,
      subtitle: game.genre,
      description: game.description,
      game,
    }),
  );

  const infoStands = Object.entries(INFO_STANDS).map(
    ([code, stand]): PlanItem => ({
      id: code,
      category: "info",
      code,
      title: stand.title,
      subtitle: "Informativo",
      description: stand.description,
      game: null,
    }),
  );

  const zones = (Object.keys(PLAN_ZONES) as ZoneId[]).map((id): PlanItem => {
    const zone = PLAN_ZONES[id];
    return {
      id,
      category: zone.category,
      code: "",
      title: zone.title,
      subtitle: zone.kind,
      description: zone.description,
      game: null,
    };
  });

  return [...teamStands, ...infoStands, ...zones];
}

/** Antetítulo del panel: "Stand A1 · Acción", "Stand C2 · Informativo" o el tipo de zona. */
export function getItemKicker(item: PlanItem) {
  if (item.category === "team" || item.category === "info") {
    return `Stand ${item.code} · ${item.subtitle}`;
  }
  return item.subtitle;
}

/** Nombre del stand partido en dos renglones, como en el diseño. */
export function splitStandName(name: string): [string, string] {
  const words = name.toUpperCase().split(" ");
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

/** Elementos agrupados por categoría, en el orden de `PLAN_CATEGORIES`. */
export function groupItemsByCategory(items: readonly PlanItem[]) {
  return PLAN_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  }));
}

export function indexItems(items: readonly PlanItem[]) {
  return new Map(items.map((item) => [item.id, item]));
}

/** Filtros: quitar el único activo los vuelve a activar todos; si no, se alterna el elegido. */
export function toggleCategory(active: ReadonlySet<PlanCategory>, category: PlanCategory): Set<PlanCategory> {
  if (active.has(category) && active.size === 1) {
    return new Set(PLAN_CATEGORIES);
  }
  const next = new Set(active);
  if (next.has(category)) {
    next.delete(category);
  } else {
    next.add(category);
  }
  return next;
}
