"use client";

import { useRef, useState } from "react";
import { EventSchedule } from "@features/event/components/event-schedule";
import { EVENT_SCHEDULE } from "@features/event/lib/event-program";
import { FloorPlanOverview } from "@features/floor-plan/components/floor-plan-overview";
import { PLAN_ZONES } from "@features/floor-plan/lib/plan-places";
import type { StandOccupant } from "@features/floor-plan/lib/types";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

/** Stand seleccionado al cargar la portada. */
const INITIAL_SELECTION = "A1";

const ZONE_TITLES: ReadonlyMap<string, string> = new Map(
  Object.entries(PLAN_ZONES).map(([id, zone]) => [id, zone.title]),
);

interface ProgramAndFloorPlanProps {
  /** Quienes ocupan los stands de equipo del croquis. */
  occupants: readonly StandOccupant[];
}

/**
 * Programa del día y croquis de la portada. Comparten la selección: cada actividad del
 * programa lleva al croquis y señala su zona.
 */
export function ProgramAndFloorPlan({ occupants }: Readonly<ProgramAndFloorPlanProps>) {
  const [selectedId, setSelectedId] = useState(INITIAL_SELECTION);
  const mapRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const locateZone = (zoneId: string) => {
    mapRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    setSelectedId(zoneId);
  };

  return (
    <>
      <EventSchedule entries={EVENT_SCHEDULE} zoneTitles={ZONE_TITLES} onLocate={locateZone} />
      <section ref={mapRef} id="floor-plan" className="section-block">
        <div className="page-wrap">
          <h2 className="type-giant">Croquis</h2>
          <FloorPlanOverview occupants={occupants} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </section>
    </>
  );
}
