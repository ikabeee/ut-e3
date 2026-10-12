"use client";

import { useRef, useState } from "react";
import { EventSchedule } from "@features/event/components/event-schedule";
import type { LocatedScheduleEntry } from "@features/event/lib/types";
import { FloorPlanOverview } from "@features/floor-plan/components/floor-plan-overview";
import type { PlanItem, PlanLayout, PlanOrientation } from "@features/floor-plan/lib/types";
import { HOME_COPY } from "@features/home/lib/home-copy";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Stand seleccionado al cargar la portada. */
const INITIAL_SELECTION = "A1";

interface ProgramAndFloorPlanProps {
  /** Título del programa: la fecha corta del evento. */
  scheduleTitle: string;
  /** Programa con la zona de cada renglón ya validada (`resolveScheduleZones`). */
  schedule: readonly LocatedScheduleEntry[];
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

  const locateZone = (zoneId: string) => {
    mapRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    setSelectedId(zoneId);
  };

  return (
    <>
      <EventSchedule title={scheduleTitle} entries={schedule} onLocate={locateZone} />
      <section ref={mapRef} id="floor-plan" className="section-block">
        <div className="page-wrap">
          <h2 className="type-giant">{HOME_COPY.floorPlanHeading}</h2>
          <FloorPlanOverview items={items} layouts={layouts} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </section>
    </>
  );
}
