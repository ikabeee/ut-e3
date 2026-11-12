import type { Metadata } from "next";
import { FLOOR_PLAN_SECTION_ID } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH } from "@features/games/lib/games-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { SCHEDULE_SECTION_ID } from "@features/schedule/lib/schedule-links";
import { NotFoundView } from "@features/site/components/not-found-view";
import { SITE_COPY } from "@features/site/lib/site-copy";
import type { NotFoundExit } from "@features/site/lib/types";

export const notFoundPageMetadata: Metadata = {
  title: SITE_COPY.notFound.title,
  robots: { index: false },
};

const EXITS = SITE_COPY.notFound.exits;

// The floor plan and the schedule are sections of the landing until they get their own pages.
export const NOT_FOUND_EXITS: NotFoundExit[] = [
  { href: GAMES_PATH, ...EXITS.games },
  { href: `${HOME_PATH}#${FLOOR_PLAN_SECTION_ID}`, ...EXITS.floorPlan },
  { href: `${HOME_PATH}#${SCHEDULE_SECTION_ID}`, ...EXITS.schedule },
];

// Rendered by src/app/not-found.tsx for unknown routes; a game slug that does not exist has its own (GameNotFoundPage).
export function NotFoundPage() {
  return <NotFoundView homeHref={HOME_PATH} exits={NOT_FOUND_EXITS} />;
}
