import type { Metadata } from "next";
import { getEventContent } from "@features/event/lib/event-content";
import { FloorPlanExplorer } from "@features/floor-plan/components/floor-plan-explorer";
import { PLAN_ITEM_COVER_SIZES } from "@features/floor-plan/components/plan-item-card";
import { FLOOR_PLAN_PATH } from "@features/floor-plan/lib/floor-plan-links";
import { buildPlanItems } from "@features/floor-plan/lib/plan-items";
import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { GameMedia } from "@features/games/components/game-media";
import { toStandOccupant } from "@features/games/lib/game-stand";
import { listGames } from "@features/games/lib/server/games-queries";

export const floorPlanPageMetadata: Metadata = {
  title: "Croquis",
  description:
    "Croquis interactivo del showcase: ubica los stands de cada equipo, el main stage, la arena de torneos y los servicios.",
  alternates: { canonical: FLOOR_PLAN_PATH },
};

/**
 * Compone el croquis con los juegos (cada uno ocupa su stand, `toStandOccupant`) y con los
 * horarios del programa del evento que citan algunas zonas.
 */
export async function FloorPlanPage() {
  const games = await listGames();
  const occupants = games.map((game) => toStandOccupant(game, <GameMedia game={game} sizes={PLAN_ITEM_COVER_SIZES} />));

  return (
    <main className="pt-[clamp(28px,4vw,48px)]">
      <div className="page-wrap">
        <FloorPlanExplorer items={buildPlanItems(occupants, getEventContent().highlights)} layouts={PLAN_LAYOUTS} />
      </div>
    </main>
  );
}
