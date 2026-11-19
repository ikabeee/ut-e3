import type { MetadataRoute } from "next";
import { FLOOR_PLAN_PATH } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH, getGamePath } from "@features/games/lib/games-links";
import { getGames } from "@features/games/lib/server/games-queries";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { RAFFLE_WINNERS_PATH } from "@features/raffle/lib/raffle-links";
import { HELP_PATH } from "@features/site/lib/help-topics";
import { SPONSORS_PATH } from "@features/sponsors/lib/sponsors-links";
import { PRIVACY_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { siteConfig } from "@shared/lib/site-config";
import { siteMode } from "@shared/lib/site-mode";

// The pages that a search engine may index (their metadata has no `robots`). The live pages (/tournament,
// /raffle/live) and everything behind a session are out of it, like in robots.ts.
const PUBLIC_PATHS = [
  HOME_PATH,
  GAMES_PATH,
  SPONSORS_PATH,
  FLOOR_PLAN_PATH,
  RAFFLE_WINNERS_PATH,
  REGISTER_PATH,
  PRIVACY_PATH,
  HELP_PATH,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The kill switch (SITE_MODE=landing) publishes only the landing: the proxy sends everything else back to it.
  if (siteMode === "landing") return toEntries([HOME_PATH]);

  // The same public catalog as /games, so a game without its artwork is not offered to the search engines.
  const games = await getGames();

  return toEntries([...PUBLIC_PATHS, ...games.map(({ slug }) => getGamePath(slug))]);
}

function toEntries(paths: readonly string[]): MetadataRoute.Sitemap {
  return paths.map((path) => ({ url: new URL(path, siteConfig.url).toString() }));
}
