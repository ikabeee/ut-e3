import type { MetadataRoute } from "next";
import { getGamePath } from "@features/games/lib/game-links";
import { listGames } from "@features/games/lib/games-queries";
import { routes, siteConfig } from "@shared/lib/site-config";

const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();

/** /sitemap.xml: páginas principales y el detalle de cada juego. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await listGames();

  return [
    { url: absoluteUrl(routes.home), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl(routes.games), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl(routes.floorPlan), changeFrequency: "monthly", priority: 0.7 },
    ...games.map((game) => ({
      url: absoluteUrl(getGamePath(game.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: game.image ? [absoluteUrl(game.image.src)] : undefined,
    })),
  ];
}
