import type { PlanCategory, PlanItem } from "@features/floor-plan/lib/types";

/** Selección y filtros del croquis: lo que cada stand o zona necesita para pintarse e interactuar. */
export interface PlanSelection {
  itemsById: ReadonlyMap<string, PlanItem>;
  selectedId: string | null;
  /** Categorías visibles (filtros); todas si se omite. */
  visibleCategories?: ReadonlySet<PlanCategory>;
  onSelectItem: (id: string) => void;
}

export interface PlanItemInteraction {
  isSelected: boolean;
  /** Atenuado por los filtros del croquis (no se puede seleccionar). */
  isHidden?: boolean;
  onSelect: () => void;
}

/**
 * Estado de un stand o zona según la selección y los filtros: si está seleccionado, si los
 * filtros lo ocultan y qué hacer al elegirlo. Un id sin elemento (por ejemplo, la entrada sin
 * datos) nunca se oculta.
 */
export function getItemInteraction(
  id: string,
  { itemsById, selectedId, visibleCategories, onSelectItem }: PlanSelection,
): PlanItemInteraction {
  const item = itemsById.get(id);

  return {
    isSelected: selectedId === id,
    isHidden: item !== undefined && visibleCategories !== undefined && !visibleCategories.has(item.category),
    onSelect: () => onSelectItem(id),
  };
}
