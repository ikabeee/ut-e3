import type { PlanLayout } from "@features/floor-plan/lib/types";

interface PlanFloorProps {
  layout: PlanLayout;
}

const DOTS_ID = "plan-dots";

export function PlanFloor({ layout }: Readonly<PlanFloorProps>) {
  const [dotsX0, dotsX1, dotsY0, dotsY1] = layout.dots;

  return (
    <>
      <defs>
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
    </>
  );
}
