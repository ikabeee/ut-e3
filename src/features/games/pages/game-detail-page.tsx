import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import type { EventSettings } from "@features/event-settings/lib/types";
import { GameDetail } from "@features/games/components/game-detail";
import { LiveItchLink } from "@features/games/components/live-itch-link";
import { isGameSlug } from "@features/games/lib/game-slug";
import { GAMES_PATH, getGamePath } from "@features/games/lib/games-links";
import { getRelatedGames } from "@features/games/lib/related-games";
import {
  GAME_OG_IMAGE_ALT,
  getGameOgImageAlt,
  getGameOgImagePath,
  renderGameOgImage,
} from "@features/games/lib/server/game-og-image";
import { getGameBySlug, getGames } from "@features/games/lib/server/games-queries";
import type { Game, GameEventLabels } from "@features/games/lib/types";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";
import { buildOgImage, buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

type GameParams = PageProps<"/games/[slug]">["params"];

// With Cache Components the build needs at least one sample slug; games added later render on their first request.
export async function generateGameDetailStaticParams() {
  const games = await getGames();

  return games.map(({ slug }) => ({ slug }));
}

export async function generateGameDetailPageMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const game = await findGame(params);
  const path = getGamePath(game.slug);

  return {
    title: game.name,
    description: game.synopsis,
    alternates: { canonical: path },
    // The page names its image itself: Next ignores the opengraph-image file of a segment whose metadata has images.
    openGraph: buildOpenGraph({
      title: `${game.name} | ${siteConfig.title}`,
      description: game.synopsis,
      url: path,
      images: [buildOgImage(getGameOgImagePath(game.slug), getGameOgImageAlt(game))],
    }),
  };
}

/** What src/app/games/[slug]/opengraph-image.tsx declares: the image of every game has the same alt text. */
export const gameDetailOgImageAlt = GAME_OG_IMAGE_ALT;

/** The generated image of a game (S11); a slug that is not a game gets the image of the site. */
export async function renderGameDetailOgImage({ params }: Readonly<{ params: GameParams }>) {
  const { slug } = await params;

  return renderGameOgImage(slug);
}

// partialPrefetching shares one App Shell across every slug, so the params read waits behind Suspense. An unknown
// slug then streams the not-found page with noindex; its first visit answers 200, later ones 404 (S4, L7).
export function GameDetailPage({ params }: PageProps<"/games/[slug]">) {
  return (
    <Suspense fallback={null}>
      <GameDetailContent params={params} />
    </Suspense>
  );
}

interface GameDetailViewProps {
  game: Game;
  games: Game[];
  settings: EventSettings;
  itchLink: ReactNode;
}

async function GameDetailContent({ params }: Readonly<{ params: GameParams }>) {
  const [game, games, settings] = await Promise.all([findGame(params), getGames(), getEventSettings()]);

  return <GameDetailView game={game} games={games} settings={settings} itchLink={<LiveItchLink slug={game.slug} />} />;
}

export function GameDetailView({ game, games, settings, itchLink }: Readonly<GameDetailViewProps>) {
  return (
    <GameDetail
      game={game}
      itchLink={itchLink}
      event={buildEventLabels(settings)}
      links={{ catalog: GAMES_PATH }}
      relatedGames={getRelatedGames(games, game)}
    />
  );
}

function buildEventLabels(settings: EventSettings): GameEventLabels {
  return {
    dateLabel: formatEventDate(settings.eventStartsAt, "numeric"),
    hoursLabel: GAMES_COPY.playLocation.hoursRange(
      formatTimeOfDay(settings.eventStartsAt),
      formatTimeOfDay(settings.eventEndsAt),
    ),
  };
}

async function findGame(params: GameParams): Promise<Game> {
  const { slug } = await params;

  // A segment such as "x.png" or ".." is never a game: answering it before the query keeps it out of the cache.
  if (!isGameSlug(slug)) notFound();

  const game = await getGameBySlug(slug);

  if (!game) notFound();

  return game;
}
