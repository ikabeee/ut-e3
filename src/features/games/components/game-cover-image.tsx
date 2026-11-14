import Image from "next/image";
import { cn } from "@heroui/react";
import { getCoverImage, getHeroImage } from "@features/games/lib/game-cover";
import type { Game } from "@features/games/lib/types";
import { GenericCover } from "@shared/components/generic-cover";

interface GameCoverImageProps {
  game: Game;
  sizes: string;
  isDecorative?: boolean;
  /** The main image of the first screen: fetched right away instead of lazily (image.md "preload"). */
  isEager?: boolean;
  /** The landscape image of the game (the hero), not the vertical cover; the cover when it has no landscape one. */
  isHero?: boolean;
  /** False where the card already writes the name over the cover (the coverflow). */
  isTitleShown?: boolean;
  className?: string;
}

export function GameCoverImage({
  game,
  sizes,
  isDecorative = false,
  isEager = false,
  isTitleShown = true,
  isHero = false,
  className,
}: Readonly<GameCoverImageProps>) {
  const cover = isHero ? getHeroImage(game) : getCoverImage(game);

  if (!cover) return <GenericCover title={game.name} isDecorative={isDecorative} isTitleShown={isTitleShown} />;

  return (
    <Image
      src={cover.path}
      alt={isDecorative ? "" : cover.alt}
      fill
      sizes={sizes}
      loading={isEager ? "eager" : "lazy"}
      fetchPriority={isEager ? "high" : "auto"}
      className={cn("object-cover", className)}
    />
  );
}
