import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import type { PlanRect } from "@features/floor-plan/lib/types";

interface PlanPublicAreaProps {
  rect: PlanRect;
  /** Id del patrón rayado (`PlanDefs`). */
  hatchId: string;
}

/** Área de público frente al escenario: rayada y con su nombre al centro (no se selecciona). */
export function PlanPublicArea({ rect: [x, y, width, height], hatchId }: Readonly<PlanPublicAreaProps>) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#${hatchId})`}
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
        className="pointer-events-none font-mono [paint-order:stroke]"
      >
        {FLOOR_PLAN_COPY.drawing.publicArea.toLocaleUpperCase("es")}
      </text>
    </>
  );
}
