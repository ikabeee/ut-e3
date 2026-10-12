import type { PlanLayout } from "@features/floor-plan/lib/types";

interface PlanFloorProps {
  dotsId: string;
  dots: PlanLayout["dots"];
  wall: string;
}

/** Piso del recinto: retícula de puntos (un solo `<rect>` con el patrón) y muro perimetral. */
export function PlanFloor({ dotsId, dots: [dotsX0, dotsX1, dotsY0, dotsY1], wall }: Readonly<PlanFloorProps>) {
  return (
    <>
      <rect
        x={dotsX0 - 0.75}
        y={dotsY0 - 0.75}
        width={dotsX1 - dotsX0 + 1.5}
        height={dotsY1 - dotsY0 + 1.5}
        fill={`url(#${dotsId})`}
      />
      <path d={wall} fill="none" stroke="var(--foreground)" strokeWidth={3} />
    </>
  );
}
