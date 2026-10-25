import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import type { PlanLayout } from "@features/floor-plan/lib/types";

interface PlanFloorProps {
  layout: PlanLayout;
}

const HATCH_ID = "plan-hatch";

const DOTS_ID = "plan-dots";

export function PlanFloor({ layout }: Readonly<PlanFloorProps>) {
  const [dotsX0, dotsX1, dotsY0, dotsY1] = layout.dots;

  return (
    <>
      <defs>
        <pattern id={HATCH_ID} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={7} stroke="var(--accent)" strokeWidth={1} strokeOpacity={0.5} />
        </pattern>
        <pattern id={DOTS_ID} x={dotsX0 - 0.75} y={dotsY0 - 0.75} width={40} height={40} patternUnits="userSpaceOnUse">
          <rect width={1.5} height={1.5} fill="var(--border)" />
        </pattern>
      </defs>
      <rect
        x={dotsX0 - 0.75}
        y={dotsY0 - 0.75}
        width={dotsX1 - dotsX0 + 1.5}
        height={dotsY1 - dotsY0 + 1.5}
        fill={`url(#${DOTS_ID})`}
      />
      <path d={layout.wall} fill="none" stroke="var(--foreground)" strokeWidth={3} />
      <PlanPublicArea layout={layout} />
    </>
  );
}

function PlanPublicArea({ layout }: Readonly<PlanFloorProps>) {
  const [x, y, width, height] = layout.publicArea;

  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#${HATCH_ID})`}
        stroke="var(--accent)"
        strokeOpacity={0.4}
        strokeDasharray="4 3"
      />
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fill="var(--foreground)"
        stroke="var(--background)"
        strokeWidth={5}
        className="pointer-events-none font-mono uppercase [paint-order:stroke]"
      >
        {FLOOR_PLAN_COPY.drawing.publicArea}
      </text>
    </>
  );
}
