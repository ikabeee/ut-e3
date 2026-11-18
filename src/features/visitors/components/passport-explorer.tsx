"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";
import { toFloorPlanStand } from "@features/floor-plan/lib/floor-plan-stands";
import type { MapItem } from "@features/floor-plan/lib/plan-items";
import type { Game } from "@features/games/lib/types";
import { PassportGameDetail } from "@features/visitors/components/passport-game-detail";
import type { PassportStand } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.passport.explorer;

interface PassportExplorerProps {
  games: readonly Game[];
  /** The stands of the passport: the detail says whether the visitor already went to the selected one. */
  stands: readonly PassportStand[];
}

/** The event map beside the detail of what the visitor taps on it; on a phone the detail goes below the map. */
export function PassportExplorer({ games, stands }: Readonly<PassportExplorerProps>) {
  const floorPlanStands = useMemo(() => games.map(toFloorPlanStand), [games]);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);

  // Stable, because the map re-reads its hash selection whenever this callback changes.
  const showItem = useCallback((item: MapItem | null) => {
    setSelectedItem(item);

    if (item) detailRef.current?.scrollIntoView?.({ block: "nearest" });
  }, []);

  return (
    <section
      aria-label={COPY.label}
      className="flex min-w-0 flex-col gap-6 min-[1000px]:border min-[1000px]:border-border min-[1000px]:bg-surface min-[1000px]:p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="type-tiny text-foreground">{COPY.mapTitle}</h2>
        <FloorPlan stands={floorPlanStands} variant="page" hasDetailOverlay={false} onSelectionChange={showItem} />
      </div>
      <PassportGameDetail
        ref={detailRef}
        item={selectedItem}
        game={findGame(games, selectedItem)}
        visited={findVisited(stands, selectedItem)}
      />
    </section>
  );
}

function findGame(games: readonly Game[], item: MapItem | null): Game | null {
  if (!item?.slug) return null;

  return games.find((game) => game.slug === item.slug) ?? null;
}

/** Whether the passport has a visit to the selected stand; `null` for a zone, which has no visits. */
function findVisited(stands: readonly PassportStand[], item: MapItem | null): boolean | null {
  if (item?.kind !== "stand") return null;

  return stands.some((stand) => stand.code === item.code && stand.visited);
}
