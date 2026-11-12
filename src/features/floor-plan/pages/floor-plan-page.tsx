import type { Metadata } from "next";
import type { ReactElement } from "react";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";
import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { FLOOR_PLAN_PATH } from "@features/floor-plan/lib/floor-plan-links";
import { toFloorPlanStand } from "@features/floor-plan/lib/floor-plan-stands";
import { STAND_MARKERS } from "@features/floor-plan/lib/map-layout";
import { countActivities, countBlocks } from "@features/floor-plan/lib/plan-items";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";
import { getGames } from "@features/games/lib/server/games-queries";
import type { EventVenue } from "@features/landing/lib/types";
import { EVENT_VENUE } from "@features/landing/lib/venue";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

const PAGE_COPY = FLOOR_PLAN_COPY.page;

const PAGE_TITLE = "Croquis";

export const floorPlanPageMetadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_COPY.description(EVENT_VENUE.building),
  alternates: { canonical: FLOOR_PLAN_PATH },
  openGraph: buildOpenGraph({
    title: `${PAGE_TITLE} | ${siteConfig.title}`,
    description: PAGE_COPY.description(EVENT_VENUE.building),
    url: FLOOR_PLAN_PATH,
  }),
};

interface FloorPlanPageViewProps {
  stands: readonly FloorPlanStand[];
  siteConfig: typeof siteConfig;
  venue: EventVenue;
}

/** The Croquis page: kicker, title, lead and summary over the event map in its page variant. */
export async function FloorPlanPage(): Promise<ReactElement> {
  const games = await getGames();

  return <FloorPlanPageView stands={games.map(toFloorPlanStand)} siteConfig={siteConfig} venue={EVENT_VENUE} />;
}

export function FloorPlanPageView({
  stands,
  siteConfig: config,
  venue,
}: Readonly<FloorPlanPageViewProps>): ReactElement {
  return (
    <main className="page-wrap grid gap-6 py-12 min-[1000px]:gap-8">
      <div>
        <p className="type-tiny text-muted">{PAGE_COPY.kicker(config.name, venue.building, venue.shortName)}</p>
        <h1 className="mt-2 type-wide text-[clamp(28px,4.4vw,60px)] leading-[.95] tracking-[-.035em] wrap-break-word">
          {FLOOR_PLAN_COPY.heading}
        </h1>
        <p className="mt-4 max-w-[62ch] text-copy">{PAGE_COPY.lead(venue.building)}</p>
        <p className="mt-2 type-tiny font-mono text-muted">
          {PAGE_COPY.summary(STAND_MARKERS.length, countBlocks(), countActivities())}
        </p>
      </div>
      <FloorPlan stands={stands} variant="page" />
    </main>
  );
}
