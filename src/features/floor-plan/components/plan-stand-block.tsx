import { FitSvgText } from "@features/floor-plan/components/fit-svg-text";
import { PlanItemGraphic } from "@features/floor-plan/components/plan-item-graphic";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { getStandCells } from "@features/floor-plan/lib/plan-layouts";
import { splitStandName } from "@features/floor-plan/lib/plan-items";
import type { PlanItem, PlanRect, PlanSelection, StandBlock } from "@features/floor-plan/lib/types";

interface PlanStandBlockProps {
  block: StandBlock;
  nameSize: number;
  selection: PlanSelection;
  touchRects: ReadonlyMap<string, PlanRect>;
}

export function PlanStandBlock({ block, nameSize, selection, touchRects }: Readonly<PlanStandBlockProps>) {
  return (
    <g>
      <text
        x={block.labelAt[0]}
        y={block.labelAt[1]}
        fontSize={11}
        fill="var(--muted)"
        className="pointer-events-none font-mono uppercase"
      >
        {FLOOR_PLAN_COPY.drawing.blockLabels[block.zone]}
      </text>
      {getStandCells(block).map(({ code, rect }) => {
        const item = selection.itemsById.get(code);

        return item ? (
          <PlanStand
            key={code}
            item={item}
            rect={rect}
            nameSize={nameSize}
            selection={selection}
            touchRect={touchRects.get(code)}
          />
        ) : null;
      })}
    </g>
  );
}

interface PlanStandProps {
  item: PlanItem;
  rect: PlanRect;
  nameSize: number;
  selection: PlanSelection;
  touchRect?: PlanRect;
}

function PlanStand({ item, rect, nameSize, selection, touchRect }: Readonly<PlanStandProps>) {
  const [x, y, width, height] = rect;
  const [firstLine, secondLine] = splitStandName(item.drawingName);

  const nameProps = {
    maxWidth: width - 14,
    x: x + 8,
    fontSize: nameSize,
    fontWeight: 500,
    fill: "var(--foreground)",
    className: "pointer-events-none font-mono",
  };

  return (
    <PlanItemGraphic item={item} rect={rect} selection={selection} touchRect={touchRect}>
      <text
        x={x + 8}
        y={y + 18}
        fontSize={12}
        fontWeight={700}
        fill={item.category === "team" ? "var(--accent)" : "var(--foreground)"}
        className="pointer-events-none font-mono"
      >
        {item.code}
      </text>
      <FitSvgText {...nameProps} y={y + height - 26}>
        {firstLine}
      </FitSvgText>
      {secondLine ? (
        <FitSvgText {...nameProps} y={y + height - 13}>
          {secondLine}
        </FitSvgText>
      ) : null}
    </PlanItemGraphic>
  );
}
