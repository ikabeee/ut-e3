import type { Metadata } from "next";
import { Suspense } from "react";
import { FloorPlanExplorer } from "@features/floor-plan/components/floor-plan-explorer";
import { FloorPlanSkeleton } from "@features/floor-plan/components/floor-plan-skeleton";
import { getGamesHydrationState } from "@features/games/lib/games-prefetch";
import { QueryHydrationBoundary } from "@shared/components/query-hydration-boundary";
import { routes } from "@shared/lib/site-config";

export const floorPlanPageMetadata: Metadata = {
  title: "Croquis",
  description:
    "Croquis interactivo del showcase: ubica los stands de cada equipo, el main stage, la arena de torneos y los servicios.",
  alternates: { canonical: routes.floorPlan },
};

export function FloorPlanPage() {
  return (
    <main className="pt-[clamp(28px,4vw,48px)]">
      <div className="page-wrap">
        <Suspense fallback={<FloorPlanSkeleton />}>
          <QueryHydrationBoundary state={getGamesHydrationState()}>
            <FloorPlanExplorer />
          </QueryHydrationBoundary>
        </Suspense>
      </div>
    </main>
  );
}
