import Image from "next/image";
import { cn } from "@heroui/react";
import type { GameImage } from "@features/games/lib/types";

export interface GameImageViewProps {
  image: GameImage;
  /** Atributo `sizes` de la imagen para servir el tamaño adecuado. */
  sizes: string;
  /** Precarga la imagen (sólo para la imagen principal visible al cargar). */
  preload?: boolean;
  /** Texto alternativo; vacío cuando el nombre del juego ya está junto a la imagen. */
  alt?: string;
  className?: string;
}

/**
 * Foto de un juego que ocupa todo su contenedor. El contenedor debe tener
 * `position: relative` y un tamaño definido (por ejemplo con `aspect-*`).
 */
export function GameImageView({ image, sizes, preload = false, alt = "", className }: Readonly<GameImageViewProps>) {
  return (
    <Image
      src={image.src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      className={cn("object-cover", className)}
      style={image.position ? { objectPosition: image.position } : undefined}
    />
  );
}
