"use client";

import { useMemo, useRef, useState } from "react";
import { EventSchedule } from "@features/event/components/event-schedule";
import type { ScheduleEntry } from "@features/event/lib/types";
import { FloorPlanOverview } from "@features/floor-plan/components/floor-plan-overview";
import type { PlanItem, PlanLayout, PlanOrientation } from "@features/floor-plan/lib/types";
import { HOME_COPY } from "@features/home/lib/home-copy";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Stand seleccionado al cargar la portada. */
const INITIAL_SELECTION = "A1";

interface ProgramAndFloorPlanProps {
  /** Título del programa: la fecha corta del evento. */
  scheduleTitle: string;
  schedule: readonly ScheduleEntry[];
  /** Stands y zonas del croquis (`buildPlanItems`). */
  items: readonly PlanItem[];
  layouts: Readonly<Record<PlanOrientation, PlanLayout>>;
}

/**
 * Programa del día y croquis de la portada. Comparten la selección: cada actividad del
 * programa lleva al croquis y señala su zona.
 */
export function ProgramAndFloorPlan({ scheduleTitle, schedule, items, layouts }: Readonly<ProgramAndFloorPlanProps>) {
  const [selectedId, setSelectedId] = useState(INITIAL_SELECTION);
  const mapRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  // Nombre visible de cada zona del croquis, para los enlaces del programa.
  const zoneTitles = useMemo(() => new Map(items.map((item) => [item.id, item.title])), [items]);

  const locateZone = (zoneId: string) => {
    mapRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    setSelectedId(zoneId);
  };

  return (
    <>
      <EventSchedule title={scheduleTitle} entries={schedule} zoneTitles={zoneTitles} onLocate={locateZone} />
      <section ref={mapRef} id="floor-plan" className="section-block">
        <div className="page-wrap">
          <h2 className="type-giant">{HOME_COPY.floorPlanHeading}</h2>
          <FloorPlanOverview items={items} layouts={layouts} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </section>
    </>
  );
}
