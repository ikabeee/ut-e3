import Image from "next/image";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { GameImage } from "@features/games/lib/types";

const GALLERY_SIZES = "(min-width: 768px) 50vw, 100vw";

interface GameGalleryProps {
  images: GameImage[];
}

export function GameGallery({ images }: Readonly<GameGalleryProps>) {
  return (
    <ul aria-label={GAMES_COPY.detail.gallery} className="grid gap-3 md:grid-cols-2">
      {images.map((image) => (
        <li key={image.path} className="relative aspect-video overflow-hidden border-2 border-border bg-surface">
          <Image src={image.path} alt={image.alt} fill sizes={GALLERY_SIZES} className="object-cover" />
        </li>
      ))}
    </ul>
  );
}
