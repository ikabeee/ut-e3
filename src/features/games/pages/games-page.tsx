import type { Metadata } from "next";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { UrlGamesBrowser } from "@features/games/components/url-games-browser";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { GAMES_PATH } from "@features/games/lib/games-links";
import { getGames } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { SiteNav } from "@features/landing/components/site-nav";
import { HOME_NAV_LINKS } from "@features/landing/lib/home-nav-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
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
    <>
      <SiteNav homeHref={HOME_PATH} links={HOME_NAV_LINKS} />
      <main>
        <h1 className="sr-only">{pageTitle}</h1>
        <FeaturedGamesCarousel games={games} />
        <div className="page-wrap pt-[clamp(40px,6vw,72px)] pb-[clamp(56px,8vw,112px)]">
          <UrlGamesBrowser games={games} />
        </div>
      </main>
    </>
  );
}
