import Link from "next/link";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { getGamePath } from "@features/games/lib/games-links";
import type { Game } from "@features/games/lib/types";
import { PixelMark } from "@features/studio/components/pixel-mark";

const COVER_SIZES = "(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 30vw";

/** The cover of a game in the studio carousel: genre on top, name below. */
export function WorkCard({ game }: Readonly<{ game: Game }>) {
  return (
    <Link
      href={getGamePath(game.slug)}
      className="group relative block aspect-4/5 overflow-hidden bg-black text-foreground no-underline outline-1 outline-transparent transition-[outline-color,rotate] duration-300 hover:-rotate-1 hover:outline-accent focus-visible:outline-accent"
    >
      <GameCoverImage
        game={game}
        sizes={COVER_SIZES}
        className="transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.05]"
      />
      <span className="absolute top-4 right-4 bg-foreground px-3 py-1.5 type-tiny text-black">{game.genre.name}</span>
      <span className="absolute bottom-4 left-4 flex max-w-[calc(100%-32px)] items-center gap-2 bg-accent px-3 py-2 type-wide text-[13px] leading-none tracking-[-.02em] text-black">
        <PixelMark />
        {game.name}
      </span>
    </Link>
  );
}
