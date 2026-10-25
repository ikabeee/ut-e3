import type { RefObject } from "react";
import { cn } from "@heroui/react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { useActiveThumbScroll } from "@features/games/hooks/use-active-thumb-scroll";
import type { Game } from "@features/games/lib/types";

interface FeaturedThumbnailsProps {
  games: Game[];
  current: number;
  onSelect: (index: number) => void;
  progressBarRef: RefObject<HTMLElement | null>;
}

export function FeaturedThumbnails({ games, current, onSelect, progressBarRef }: Readonly<FeaturedThumbnailsProps>) {
  const trackRef = useActiveThumbScroll<HTMLDivElement>(current);

  return (
    <div
      ref={trackRef}
      className="scrollbar-none flex min-h-0 flex-1 snap-x snap-mandatory gap-[10px] overflow-x-auto max-[760px]:h-[118px] max-[760px]:flex-none"
    >
      {games.map((game, index) => (
        <FeaturedThumbnail
          key={game.id}
          game={game}
          isCurrent={index === current}
          onSelect={() => onSelect(index)}
          progressBarRef={progressBarRef}
        />
      ))}
    </div>
  );
}

interface FeaturedThumbnailProps {
  game: Game;
  isCurrent: boolean;
  onSelect: () => void;
  progressBarRef: RefObject<HTMLElement | null>;
}

function FeaturedThumbnail({ game, isCurrent, onSelect, progressBarRef }: Readonly<FeaturedThumbnailProps>) {
  return (
    <button
      type="button"
      aria-label={game.name}
      aria-current={isCurrent}
      onClick={onSelect}
      className={cn(
        "group relative aspect-16/10 h-full flex-none cursor-pointer snap-start overflow-hidden border bg-surface p-0 text-left text-foreground",
        isCurrent ? "border-accent" : "border-border",
      )}
    >
      <GameCoverImage
        game={game}
        sizes="200px"
        isDecorative
        className={cn(
          "transition-[filter,transform] duration-300",
          !isCurrent &&
            "brightness-50 grayscale group-hover:scale-[1.04] group-hover:brightness-[.85] group-hover:grayscale-[.3]",
        )}
      />
      <span aria-hidden="true" className="absolute inset-0 shade-thumb" />
      <ThumbnailName name={game.name} isCurrent={isCurrent} />
      <i
        ref={isCurrent ? progressBarRef : undefined}
        aria-hidden="true"
        className="absolute top-0 left-0 z-1 h-[3px] bg-accent"
        style={isCurrent ? undefined : { width: 0 }}
      />
    </button>
  );
}

interface ThumbnailNameProps {
  name: string;
  isCurrent: boolean;
}

function ThumbnailName({ name, isCurrent }: Readonly<ThumbnailNameProps>) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-x-[10px] bottom-[10px] z-1 type-wide text-[clamp(10px,.95vw,13px)] leading-[1.1] tracking-[-.02em]",
        isCurrent && "text-accent",
      )}
    >
      {name}
    </span>
  );
}
