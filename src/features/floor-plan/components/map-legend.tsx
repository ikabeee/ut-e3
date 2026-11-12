import type { ReactElement } from "react";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";

/** What each marker kind means: a stand, an activity or service, a zone. */
export function MapLegend(): ReactElement {
  return (
    <ul aria-label={FLOOR_PLAN_COPY.legend.label} className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
      {FLOOR_PLAN_COPY.legend.entries.map((entry) => (
        <li key={entry} className="flex items-center gap-2 type-tiny text-muted">
          <span aria-hidden="true" className={swatchClass(entry)} />
          {entry}
        </li>
      ))}
    </ul>
  );
}

function swatchClass(entry: string): string {
  if (entry === "Stand") return "size-3.5 rounded-full border-2 border-foreground bg-accent";

  if (entry === "Actividad o servicio") return "size-3.5 rounded-full bg-foreground";

  return "h-0 w-3.5 border-t border-dashed border-muted";
}
