import type { PlanLayout } from "@features/floor-plan/lib/types";

/** Ids de los `<pattern>` de un croquis; cada croquis de la página usa su propio prefijo. */
export interface PlanPatternIds {
  hatch: string;
  dots: string;
}

interface PlanDefsProps {
  ids: PlanPatternIds;
  dots: PlanLayout["dots"];
}

/** Patrones del croquis: rayado del área de público y punto de la retícula. */
export function PlanDefs({ ids, dots: [dotsX0, , dotsY0] }: Readonly<PlanDefsProps>) {
  return (
    <defs>
      <pattern id={ids.hatch} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1={0} y1={0} x2={0} y2={7} stroke="var(--accent)" strokeWidth={1} strokeOpacity={0.5} />
      </pattern>
      <pattern id={ids.dots} x={dotsX0 - 0.75} y={dotsY0 - 0.75} width={40} height={40} patternUnits="userSpaceOnUse">
        <rect width={1.5} height={1.5} fill="var(--border)" />
      </pattern>
    </defs>
  );
}
