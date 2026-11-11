"use client";

import { FitSvgText } from "@features/floor-plan/components/fit-svg-text";
import { PlanItemShape } from "@features/floor-plan/components/plan-item-shape";
import { getStandCells } from "@features/floor-plan/lib/plan-layouts";
import { splitStandName } from "@features/floor-plan/lib/plan-items";
import { PLAN_ZONES } from "@features/floor-plan/lib/plan-places";
import type { PlanCategory, PlanItem, PlanLayout, PlanOrientation, ZoneId } from "@features/floor-plan/lib/types";

/** `overview`: croquis resumido del inicio. `explorer`: croquis interactivo de /floor-plan. */
export type FloorPlanVariant = "overview" | "explorer";

export interface FloorPlanSelectionProps {
  itemsById: ReadonlyMap<string, PlanItem>;
  selectedId: string | null;
  /** Categorías visibles (filtros); todas si se omite. */
  visibleCategories?: ReadonlySet<PlanCategory>;
  onSelectItem: (id: string) => void;
}

interface FloorPlanDrawingProps extends FloorPlanSelectionProps {
  layout: PlanLayout;
  orientation: PlanOrientation;
  variant: FloorPlanVariant;
}

const MONO = "var(--font-mono)";
const WIDE = "var(--font-wide)";

/**
 * Contenido SVG del croquis (muro, retícula, zonas, entrada y stands). El `<svg>` lo pone
 * quien lo usa, porque el inicio y la página del croquis lo manejan distinto.
 */
export function FloorPlanDrawing({
  layout,
  orientation,
  variant,
  itemsById,
  selectedId,
  visibleCategories,
  onSelectItem,
}: Readonly<FloorPlanDrawingProps>) {
  const idPrefix = `plan-${variant}-${orientation}`;
  const [dotsX0, dotsX1, dotsY0, dotsY1] = layout.dots;
  const isExplorer = variant === "explorer";

  const interaction = (id: string) => {
    const item = itemsById.get(id);
    return {
      isSelected: selectedId === id,
      isHidden: item !== undefined && visibleCategories !== undefined && !visibleCategories.has(item.category),
      onSelect: () => onSelectItem(id),
    };
  };

  const [publicX, publicY, publicWidth, publicHeight] = layout.publicArea;
  const publicArea = (
    <>
      <rect
        x={publicX}
        y={publicY}
        width={publicWidth}
        height={publicHeight}
        fill={`url(#${idPrefix}-hatch)`}
        stroke="var(--accent)"
        strokeOpacity={0.4}
        strokeDasharray="4 3"
      />
      <text
        x={publicX + publicWidth / 2}
        y={publicY + publicHeight / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fill="var(--foreground)"
        style={{ fontFamily: MONO, paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 5, pointerEvents: "none" }}
      >
        PÚBLICO
      </text>
    </>
  );

  const [entryX, entryY, entryWidth, entryHeight] = layout.entry;
  const entryCenter = entryX + entryWidth / 2;

  return (
    <>
      <defs>
        <pattern id={`${idPrefix}-hatch`} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={7} stroke="var(--accent)" strokeWidth={1} strokeOpacity={0.5} />
        </pattern>
        <pattern id={`${idPrefix}-dots`} x={dotsX0 - 0.75} y={dotsY0 - 0.75} width={40} height={40} patternUnits="userSpaceOnUse">
          <rect width={1.5} height={1.5} fill="var(--border)" />
        </pattern>
      </defs>
      <rect
        x={dotsX0 - 0.75}
        y={dotsY0 - 0.75}
        width={dotsX1 - dotsX0 + 1.5}
        height={dotsY1 - dotsY0 + 1.5}
        fill={`url(#${idPrefix}-dots)`}
      />
      <path d={layout.wall} fill="none" stroke="var(--foreground)" strokeWidth={3} />

      {isExplorer ? publicArea : null}

      {(Object.entries(layout.zones) as [Exclude<ZoneId, "entry">, NonNullable<PlanLayout["zones"]["stage"]>][]).map(
        ([id, zone]) => {
          const isActivity = PLAN_ZONES[id].category === "act";
          const color = isActivity ? "var(--accent)" : "var(--muted)";
          const [x, y, width] = zone.rect;
          const fontSize = zone.fontSize ?? 18;
          return (
            <PlanItemShape
              key={id}
              id={id}
              label={PLAN_ZONES[id].title}
              rect={zone.rect}
              fill={color}
              fillOpacity={isActivity ? 0.14 : 0.22}
              stroke={color}
              {...interaction(id)}
            >
              <FitSvgText
                maxWidth={width - 18}
                x={x + 10}
                y={y + fontSize + 6}
                fontSize={fontSize}
                fontWeight={800}
                fill={isActivity ? "var(--accent)" : "var(--foreground)"}
                style={{
                  fontFamily: WIDE,
                  textTransform: "uppercase",
                  pointerEvents: "none",
                  fontVariationSettings: isExplorer ? undefined : "'wdth' 125",
                }}
              >
                {zone.label}
              </FitSvgText>
            </PlanItemShape>
          );
        },
      )}

      {isExplorer ? null : publicArea}

      <PlanItemShape
        id="entry"
        label="Entrada"
        rect={layout.entry}
        fill="var(--accent)"
        fillOpacity={0.06}
        stroke="var(--accent)"
        strokeDasharray="5 4"
        {...interaction("entry")}
      >
        <path
          d={`M${entryCenter} ${entryY + entryHeight - 8} V${entryY + 14} M${entryCenter - 12} ${entryY + 26} L${entryCenter} ${entryY + 14} L${entryCenter + 12} ${entryY + 26}`}
          stroke="var(--accent)"
          strokeWidth={3}
          fill="none"
        />
      </PlanItemShape>
      {isExplorer ? null : (
        <text
          x={layout.entryLabelAt?.[0] ?? entryCenter}
          y={layout.entryLabelAt?.[1] ?? layout.height - 4}
          textAnchor="middle"
          fontSize={layout.entryLabelAt ? 11 : 10}
          fill="var(--accent)"
          style={{ fontFamily: MONO }}
        >
          ENTRADA
        </text>
      )}

      {layout.standBlocks.map((block) => (
        <g key={block.prefix}>
          <text x={block.labelAt[0]} y={block.labelAt[1]} fontSize={11} fill="var(--muted)" style={{ fontFamily: MONO }}>
            {block.name}
          </text>
          {getStandCells(block).map(({ code, rect }) => {
            const item = itemsById.get(code);
            const isTeam = item?.category === "team";
            const [x, y, width, height] = rect;
            const [firstLine, secondLine] = splitStandName(item?.title ?? "");
            const nameProps = {
              maxWidth: width - 14,
              x: x + 8,
              fontSize: layout.standNameSize,
              fontWeight: 500,
              fill: "var(--foreground)",
              style: { fontFamily: MONO, pointerEvents: "none" as const },
            };
            return (
              <PlanItemShape
                key={code}
                id={code}
                label={isExplorer && item ? `Stand ${code}, ${item.title}` : `Stand ${code}`}
                rect={rect}
                fill={isTeam ? "var(--accent)" : "var(--background)"}
                fillOpacity={isTeam ? 0.2 : 1}
                stroke={isTeam ? "var(--accent)" : "var(--foreground)"}
                strokeDasharray={isTeam ? undefined : "3 3"}
                {...interaction(code)}
              >
                <text
                  x={x + 8}
                  y={y + 18}
                  fontSize={12}
                  fontWeight={700}
                  fill={isTeam ? "var(--accent)" : "var(--foreground)"}
                  style={{ fontFamily: MONO, pointerEvents: "none" }}
                >
                  {code}
                </text>
                <FitSvgText {...nameProps} y={y + height - 26}>
                  {firstLine}
                </FitSvgText>
                {secondLine ? (
                  <FitSvgText {...nameProps} y={y + height - 13}>
                    {secondLine}
                  </FitSvgText>
                ) : null}
              </PlanItemShape>
            );
          })}
        </g>
      ))}
    </>
  );
}
