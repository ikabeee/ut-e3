import Image from "next/image";
import { cn } from "@heroui/react";
import { getCoverImage } from "@features/games/lib/game-cover";
import type { Game } from "@features/games/lib/types";

interface GameCoverImageProps {
  game: Game;
  sizes: string;
  isDecorative?: boolean;
  /** The main image of the first screen: fetched right away instead of lazily (image.md "preload"). */
  isEager?: boolean;
  className?: string;
}

export function GameCoverImage({
  game,
  sizes,
  isDecorative = false,
  isEager = false,
  className,
}: Readonly<GameCoverImageProps>) {
  const cover = getCoverImage(game);

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
