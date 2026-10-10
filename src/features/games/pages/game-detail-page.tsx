import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENT_INFO } from "@features/event/lib/event-info";
import { GameAbout } from "@features/games/components/game-about";
import { GameDetailHeader } from "@features/games/components/game-detail-header";
import { GameGallery } from "@features/games/components/game-gallery";
import { GamePlayLocation } from "@features/games/components/game-play-location";
import { GameSidebar } from "@features/games/components/game-sidebar";
import { GameTags } from "@features/games/components/game-tags";
import { RelatedGames } from "@features/games/components/related-games";
import { getRelatedGames } from "@features/games/lib/game-details";
import { getGalleryShots } from "@features/games/lib/game-gallery";
import { getGamePath } from "@features/games/lib/game-links";
import { buildGameStructuredData } from "@features/games/lib/game-structured-data";
import { getGameBySlug, listGames } from "@features/games/lib/games-queries";
import { JsonLd } from "@shared/components/json-ld";
import { siteConfig } from "@shared/lib/site-config";

type GameDetailPageProps = PageProps<"/games/[slug]">;

/** Prerenderiza el detalle de todos los juegos en el build (SEO y carga instantánea). */
export async function generateGameDetailStaticParams() {
  const games = await listGames();
  return games.map((game) => ({ slug: game.slug }));
}

export async function generateGameDetailMetadata({ params }: GameDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) {
    return { title: "Juego no encontrado" };
  }

  const images = game.image ? [{ url: game.image.src, alt: game.name }] : undefined;
  return {
    title: game.name,
    description: `${game.description} ${game.team} · Stand ${game.stand} · ${game.genre}.`,
    alternates: { canonical: getGamePath(game.slug) },
    openGraph: { title: game.name, description: game.description, type: "article", images },
    twitter: { card: images ? "summary_large_image" : "summary", title: game.name, description: game.description },
  };
}

export async function GameDetailPage({ params }: GameDetailPageProps) {
  const { slug } = await params;
  const [game, games] = await Promise.all([getGameBySlug(slug), listGames()]);
  if (!game) {
    notFound();
  }

  return (
    <main className="pt-[clamp(24px,4vw,48px)]">
      <JsonLd data={buildGameStructuredData(game, siteConfig.url)} />
      <div className="page-wrap">
        <GameDetailHeader game={game} />

        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-[clamp(24px,4vw,56px)] max-[980px]:grid-cols-1">
          <div className="flex min-w-0 flex-col gap-7">
            <GameGallery
              gameName={game.name}
              shots={getGalleryShots(game, games.length)}
              labels={{ stand: game.stand, genre: game.genre, members: game.members }}
            />
            <p className="m-0 max-w-[62ch] text-[clamp(17px,1.5vw,20px)] leading-[1.4] text-copy-strong">{game.description}</p>
            <GameTags game={game} />
            <GameAbout game={game} />
            <GamePlayLocation game={game} eventDateLabel={EVENT_INFO.dateLabel} eventHoursLabel={EVENT_INFO.hoursLabel} />
          </div>

          <GameSidebar
            game={game}
            eventDateLabel={EVENT_INFO.dateLabel}
            admissionLabel={EVENT_INFO.admission}
            calendarUrl={EVENT_INFO.calendarUrl}
          />
        </div>

        <RelatedGames games={getRelatedGames(games, game)} />
      </div>
    </main>
  );
}
