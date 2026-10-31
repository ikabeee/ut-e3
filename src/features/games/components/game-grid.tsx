import Link from "next/link";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { getGamePath } from "@features/games/lib/games-links";
import type { Game } from "@features/games/lib/types";

const CARD_COVER_SIZES = "(max-width: 760px) 50vw, (max-width: 1000px) 33vw, (max-width: 1200px) 25vw, 20vw";

export function GameGrid({ games }: Readonly<{ games: Game[] }>) {
  return (
    <ul
      aria-label={GAMES_COPY.catalog.allGames}
      className="m-0 grid list-none grid-cols-5 gap-x-4 gap-y-[22px] p-0 max-[1200px]:grid-cols-4 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-2"
    >
      {games.map((game) => (
        <li key={game.slug} className="min-w-0">
          <GameCard game={game} />
        </li>
      ))}
    </ul>
  );
}

function GameCard({ game }: Readonly<{ game: Game }>) {
  return (
    <Link href={getGamePath(game.slug)} className="group flex flex-col gap-[10px] text-foreground no-underline">
      <div className="relative aspect-3/4 overflow-hidden bg-surface outline-1 outline-surface transition-[outline-color] duration-200 group-hover:outline-accent">
        <GameCoverImage
          game={game}
          sizes={CARD_COVER_SIZES}
          className="transition-transform duration-500 ease-snap group-hover:scale-[1.04]"
        />
      </div>
      <h3 className="type-wide text-sm leading-[1.05] tracking-[-.02em] group-hover:text-accent">{game.name}</h3>
      <span className="type-tiny text-muted">{GAMES_COPY.detail.meta(game)}</span>
    </Link>
  );
}
