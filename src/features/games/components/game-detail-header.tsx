import Link from "next/link";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

interface GameDetailHeaderProps {
  game: Game;
  catalogHref: string;
}

export function GameDetailHeader({ game, catalogHref }: Readonly<GameDetailHeaderProps>) {
  return (
    <header className="flex flex-col gap-2.5">
      <Link
        href={catalogHref}
        className="touch-target relative mb-2 self-start type-tiny text-muted no-underline hover:text-accent"
      >
        {GAMES_COPY.detail.backToCatalog}
      </Link>
      <h1 className="type-wide text-[clamp(28px,4.4vw,60px)] leading-[.95] tracking-[-.035em] wrap-break-word">
        {game.name}
      </h1>
      <p className="type-tiny text-muted">{GAMES_COPY.detail.meta(game)}</p>
    </header>
  );
}
