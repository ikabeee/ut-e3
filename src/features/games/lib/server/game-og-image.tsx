import "server-only";
import type { ImageResponse } from "next/og";
import { isGameSlug } from "@features/games/lib/game-slug";
import { getGamePath } from "@features/games/lib/games-links";
import { formatStandCode } from "@features/games/lib/stand-code";
import { getGameBySlug } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { buildSiteOgCard, renderOgImage, type OgCard } from "@shared/lib/og-image";
import { siteConfig } from "@shared/lib/site-config";

/** What the opengraph-image route of a game says about itself; each page names its own game in the metadata. */
export const GAME_OG_IMAGE_ALT = `Ficha de un juego de ${siteConfig.name}`;

/** The address of the generated image of a game: the opengraph-image route that lives next to its page. */
export function getGameOgImagePath(slug: string): string {
  return `${getGamePath(slug)}/opengraph-image`;
}

/** The alt text of the generated image of a game, for the metadata of its page. */
export function getGameOgImageAlt(game: Pick<Game, "name">): string {
  return `Ficha de ${game.name} en ${siteConfig.name}`;
}

export async function renderGameOgImage(slug: string): Promise<ImageResponse> {
  // A segment such as "x.png" or ".." is never a game: answering it before the query keeps it out of the cache.
  const game = isGameSlug(slug) ? await getGameBySlug(slug) : null;

  return renderOgImage(buildGameOgCard(game));
}

/**
 * The card of a game: its name, its genre and its stand, like the card the visitor finds in the catalog. A game that
 * does not exist (or is not public yet) gets the card of the site instead of an error: a share link must always show
 * something.
 */
export function buildGameOgCard(game: Game | null): OgCard {
  const site = buildSiteOgCard([]);

  if (!game) return site;

  return {
    ...site,
    eyebrow: siteConfig.name,
    title: game.name,
    details: [game.genre.name, formatStandCode(game.stand)],
  };
}
