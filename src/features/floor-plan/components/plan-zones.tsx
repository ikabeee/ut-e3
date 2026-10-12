"use client";

import { cn } from "@heroui/react";
import { FitSvgText } from "@features/floor-plan/components/fit-svg-text";
import { PlanItemShape } from "@features/floor-plan/components/plan-item-shape";
import { getItemInteraction, type PlanSelection } from "@features/floor-plan/lib/plan-interaction";
import type { FloorPlanVariant, PlanLayout, PlanRect, ZoneId, ZoneShape } from "@features/floor-plan/lib/types";

interface PlanZonesProps {
  zones: PlanLayout["zones"];
  variant: FloorPlanVariant;
  selection: PlanSelection;
  /** Áreas táctiles por id (`getTouchRects`). */
  touchRects: ReadonlyMap<string, PlanRect>;
}

/** Tamaño de la etiqueta cuando la zona no lo define. */
const DEFAULT_ZONE_FONT_SIZE = 18;

/**
 * Zonas del recinto (escenario, arena, servicios...): las actividades en azul y los servicios en
 * gris. Una zona sin datos en `itemsById` no se pinta.
 */
export function PlanZones({ zones, variant, selection, touchRects }: Readonly<PlanZonesProps>) {
  return (Object.entries(zones) as [Exclude<ZoneId, "entry">, ZoneShape][]).map(([id, zone]) => {
    const item = selection.itemsById.get(id);
    if (!item) {
      return null;
    }
    const isActivity = item.category === "act";
    const color = isActivity ? "var(--accent)" : "var(--muted)";
    const [x, y, width] = zone.rect;
    const fontSize = zone.fontSize ?? DEFAULT_ZONE_FONT_SIZE;
    return (
      <PlanItemShape
        key={id}
        id={id}
        label={item.title}
        rect={zone.rect}
        fill={color}
        fillOpacity={isActivity ? 0.14 : 0.22}
        stroke={color}
        touchRect={touchRects.get(id)}
        {...getItemInteraction(id, selection)}
      >
        <FitSvgText
          maxWidth={width - 18}
          x={x + 10}
          y={y + fontSize + 6}
          fontSize={fontSize}
          fontWeight={800}
          fill={isActivity ? "var(--accent)" : "var(--foreground)"}
          // En el croquis del inicio la etiqueta usa el ancho extendido de la tipografía.
          className={cn(
            "pointer-events-none font-wide uppercase",
            variant === "overview" && "[font-variation-settings:'wdth'_125]",
          )}
        >
          {zone.label}
        </FitSvgText>
      </PlanItemShape>
    );
  });
}
