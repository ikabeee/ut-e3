import type { Game } from "@features/games/lib/types";
import { RelatedGames } from "@features/games/components/related-games";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { GAMES_PATH } from "@features/games/lib/games-links";
import { RELATED_GAMES_LIMIT } from "@features/games/lib/related-games";
import { getGames } from "@features/games/lib/server/games-queries";
import { SiteNav } from "@features/landing/components/site-nav";
import { HOME_NAV_LINKS } from "@features/landing/lib/home-nav-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { NotFoundView } from "@features/site/components/not-found-view";
import { NOT_FOUND_EXITS } from "@features/site/pages/not-found-page";

// Rendered by src/app/games/[slug]/not-found.tsx: says that what is missing is a game and offers a few to keep going.
// getGames() is cached, so the page still prerenders.
export async function GameNotFoundPage() {
  return <GameNotFoundView games={await getGames()} />;
}

export function GameNotFoundView({ games }: Readonly<{ games: Game[] }>) {
  return (
    <>
      <SiteNav homeHref={HOME_PATH} links={HOME_NAV_LINKS} />
      <NotFoundView
        homeHref={HOME_PATH}
        exits={NOT_FOUND_EXITS}
        title={GAMES_COPY.notFound.title}
        description={GAMES_COPY.notFound.description}
      >
        <RelatedGames games={games.slice(0, RELATED_GAMES_LIMIT)} catalogHref={GAMES_PATH} />
      </NotFoundView>
    </>
  );
}
