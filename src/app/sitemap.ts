import type { MetadataRoute } from "next";
import { FLOOR_PLAN_PATH } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH, getGamePath } from "@features/games/lib/game-links";
import { listGames } from "@features/games/lib/server/games-queries";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { siteConfig } from "@shared/lib/site-config";

const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();

/** /sitemap.xml: páginas principales y el detalle de cada juego. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await listGames();

  return [
    { url: absoluteUrl(HOME_PATH), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl(GAMES_PATH), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl(FLOOR_PLAN_PATH), changeFrequency: "monthly", priority: 0.7 },
    ...games.map((game) => ({
      url: absoluteUrl(getGamePath(game.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [absoluteUrl(game.image.src)],
    })),
  ];
}
