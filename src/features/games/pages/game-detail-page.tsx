import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { GameDetail } from "@features/games/components/game-detail";
import { GameItchLink } from "@features/games/components/game-itch-link";
import { getCoverImage } from "@features/games/lib/game-cover";
import { GAMES_SECTION_ID, getGamePath } from "@features/games/lib/games-links";
import { resolveItchLink, type ItchLink } from "@features/games/lib/itch-link";
import { getGameBySlug, getGames } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

const CATALOG_HREF = `${HOME_PATH}#${GAMES_SECTION_ID}`;

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
    <Suspense fallback={null}>
      <GameDetailContent params={params} />
    </Suspense>
  );
}

async function GameDetailContent({ params }: Readonly<Pick<PageProps<"/games/[slug]">, "params">>) {
  const game = await findGame(params);

  return (
    <GameDetail
      game={game}
      backHref={CATALOG_HREF}
      itchLink={
        <Suspense fallback={null}>
          <GameItchLinkGate itchUrl={game.itchUrl} />
        </Suspense>
      }
    />
  );
}

async function findGame(params: PageProps<"/games/[slug]">["params"]): Promise<Game> {
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
