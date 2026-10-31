import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import type { EventSettings } from "@features/event-settings/lib/types";
import { floorPlanItemHref } from "@features/floor-plan/lib/floor-plan-links";
import { GameDetail } from "@features/games/components/game-detail";
import { GameItchLink } from "@features/games/components/game-itch-link";
import { getCoverImage } from "@features/games/lib/game-cover";
import { GAMES_PATH, getGamePath } from "@features/games/lib/games-links";
import { resolveItchLink, type ItchLink } from "@features/games/lib/itch-link";
import { getRelatedGames } from "@features/games/lib/related-games";
import { getGameBySlug, getGames } from "@features/games/lib/server/games-queries";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game, GameDetailLinks, GameEventLabels } from "@features/games/lib/types";
import { SiteNav } from "@features/landing/components/site-nav";
import { buildEventCalendarUrl } from "@features/landing/lib/calendar-link";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { HOME_NAV_LINKS } from "@features/landing/lib/home-nav-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

type GameParams = PageProps<"/games/[slug]">["params"];

// With Cache Components the build needs at least one sample slug; games added later render on their first request.
export async function generateGameDetailStaticParams() {
  const games = await getGames();

  return games.map(({ slug }) => ({ slug }));
}

export async function generateGameDetailPageMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const game = await findGame(params);
  const cover = getCoverImage(game);

  return {
    title: game.name,
    description: game.synopsis,
    alternates: { canonical: getGamePath(game.slug) },
    openGraph: buildOpenGraph({
      title: `${game.name} | ${siteConfig.title}`,
      description: game.synopsis,
      url: getGamePath(game.slug),
      images: [{ url: cover.path, alt: cover.alt }],
    }),
  };
}

// partialPrefetching shares one App Shell across every slug, so the params read waits behind Suspense. An unknown
// slug then streams the not-found page with noindex; its first visit answers 200, later ones 404 (S4, L7).
export function GameDetailPage({ params }: PageProps<"/games/[slug]">) {
  return (
    <>
      <SiteNav homeHref={HOME_PATH} links={HOME_NAV_LINKS} />
      <Suspense fallback={null}>
        <GameDetailContent params={params} />
      </Suspense>
    </>
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

  return (
    <GameDetailView
      game={game}
      games={games}
      settings={settings}
      itchLink={
        <Suspense fallback={null}>
          <GameItchLinkGate itchUrl={game.itchUrl} />
        </Suspense>
      }
    />
  );
}

export function GameDetailView({ game, games, settings, itchLink }: Readonly<GameDetailViewProps>) {
  return (
    <GameDetail
      game={game}
      itchLink={itchLink}
      event={buildEventLabels(settings)}
      links={buildDetailLinks(game, settings)}
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

// The floor plan is a section of the landing until it gets its own page.
function buildDetailLinks(game: Game, settings: EventSettings): GameDetailLinks {
  return {
    catalog: GAMES_PATH,
    floorPlan: `${HOME_PATH}${floorPlanItemHref(formatStandCode(game.stand))}`,
    calendar: buildEventCalendarUrl({ startsAt: settings.eventStartsAt, endsAt: settings.eventEndsAt }),
  };
}

async function findGame(params: GameParams): Promise<Game> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) notFound();

  return game;
}

async function GameItchLinkGate({ itchUrl }: Readonly<Pick<Game, "itchUrl">>) {
  return <GameItchLink link={await readItchLink(itchUrl)} />;
}

// RF-10 judges the link by the server clock, so only this block renders per request; the rest of the page is cached.
async function readItchLink(itchUrl: string | null): Promise<ItchLink> {
  await connection();

  const { itchOpensAt } = await getEventSettings();

  return resolveItchLink({ itchUrl, itchOpensAt, now: new Date() });
}
