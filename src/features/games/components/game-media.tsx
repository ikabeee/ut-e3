import Image from "next/image";
import { cn } from "@heroui/react";
import { GameArtCanvas } from "@features/games/components/game-art-canvas";
import type { Game } from "@features/games/lib/types";

interface GameMediaProps {
  game: Game;
  /** Atributo `sizes` de la imagen para servir el tamaño adecuado. */
  sizes: string;
  /** Precarga la imagen (sólo para la imagen principal visible al cargar). */
  preload?: boolean;
  /** Texto alternativo; vacío cuando el nombre del juego ya está junto a la imagen. */
  alt?: string;
  className?: string;
}

/**
 * Portada de un juego: su imagen si la tiene o, si no, el arte generado.
 * Ocupa todo su contenedor, que debe tener `position: relative` y un tamaño definido.
 */
export function GameMedia({ game, sizes, preload = false, alt = "", className }: Readonly<GameMediaProps>) {
  if (game.image) {
    return (
      <Image
        src={game.image.src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={cn("object-cover", className)}
        style={{ objectPosition: game.image.position }}
      />
    );
  }

  return (
    <GameArtCanvas
      art={game.art}
      labels={{ stand: game.stand, genre: game.genre, members: game.members }}
      className={cn("absolute inset-0", className)}
    />
  );
}
