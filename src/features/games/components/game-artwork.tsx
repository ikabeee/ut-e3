import Image from "next/image";
import { cn } from "@heroui/react";
import { GameArtCanvas } from "@features/games/components/game-art-canvas";
import type { ArtLabels } from "@features/games/lib/game-art";
import type { GameVisual } from "@features/games/lib/types";

export interface GameArtworkProps {
  visual: GameVisual;
  labels: ArtLabels;
  /** Atributo `sizes` de la imagen para servir el tamaño adecuado. */
  sizes: string;
  /** Precarga la imagen (sólo para la imagen principal visible al cargar). */
  preload?: boolean;
  /** Texto alternativo; vacío cuando el nombre del juego ya está junto a la imagen. */
  alt?: string;
  className?: string;
}

/**
 * Imagen o arte generado que ocupa todo su contenedor. El contenedor debe tener
 * `position: relative` y un tamaño definido (por ejemplo con `aspect-*`).
 */
export function GameArtwork({ visual, labels, sizes, preload = false, alt = "", className }: Readonly<GameArtworkProps>) {
  if (visual.kind === "image") {
    return (
      <Image
        src={visual.image.src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={cn("object-cover", className)}
        style={{ objectPosition: visual.image.position }}
      />
    );
  }

  return <GameArtCanvas art={visual.art} labels={labels} className={cn("absolute inset-0", className)} />;
}
