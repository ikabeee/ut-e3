import type { Metadata } from "next";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { UrlGamesBrowser } from "@features/games/components/url-games-browser";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { GAMES_PATH } from "@features/games/lib/games-links";
import { getGames } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

const { pageTitle, pageDescription } = GAMES_COPY.catalog;

export const gamesPageMetadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: GAMES_PATH },
  openGraph: buildOpenGraph({
    title: `${pageTitle} | ${siteConfig.title}`,
    description: pageDescription,
    url: GAMES_PATH,
  }),
};

export async function GamesPage() {
  return <GamesView games={await getGames()} />;
}

export function GamesView({ games }: Readonly<{ games: Game[] }>) {
  return (
    <main>
      <UrlGamesBrowser games={games} hero={<FeaturedGamesCarousel games={games} />} />
    </main>
  );
}
