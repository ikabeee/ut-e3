import type { Metadata } from "next";
import { FLOOR_PLAN_PATH } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH } from "@features/games/lib/game-links";
import { HOME_PATH } from "@features/home/lib/home-links";
import { OFFLINE_COPY } from "@features/offline/lib/offline-copy";
import { ActionLink } from "@shared/components/action-link";

/** Página de respaldo del service worker: no se indexa ni va en el sitemap. */
export const offlinePageMetadata: Metadata = {
  title: OFFLINE_COPY.page.metaTitle,
  description: OFFLINE_COPY.page.metaDescription,
  robots: { index: false, follow: false },
};

export function OfflinePage() {
  return (
    <main className="page-wrap flex flex-col items-start gap-6 pt-[clamp(48px,8vw,120px)]">
      <p className="type-tiny m-0 text-accent">{OFFLINE_COPY.page.kicker}</p>
      <h1 className="type-giant">{OFFLINE_COPY.page.title}</h1>
      <p className="m-0 max-w-[46ch] text-copy">{OFFLINE_COPY.page.description}</p>
      <nav aria-label={OFFLINE_COPY.page.navigationLabel} className="flex flex-wrap gap-3">
        <ActionLink href={HOME_PATH} variant="primary" arrow="e">
          {OFFLINE_COPY.page.links.home}
        </ActionLink>
        <ActionLink href={GAMES_PATH} arrow="e">
          {OFFLINE_COPY.page.links.games}
        </ActionLink>
        <ActionLink href={FLOOR_PLAN_PATH} arrow="e">
          {OFFLINE_COPY.page.links.floorPlan}
        </ActionLink>
      </nav>
    </main>
  );
}
