import { cn } from "@heroui/react";
import { GameMedia } from "@features/games/components/game-media";
import type { Game } from "@features/games/lib/types";

const COVER_SIZES = "270px";

interface CoverflowCoverProps {
  game: Game;
  isCurrent: boolean;
  /** El reflejo no lleva el resplandor de la caja activa. */
  isReflection?: boolean;
}

/** Portada de la caja: arte o imagen con el nombre abajo (`.c-cover`). */
export function CoverflowCover({ game, isCurrent, isReflection = false }: Readonly<CoverflowCoverProps>) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden border-2 border-case-border bg-case-face [backface-visibility:hidden]",
        isCurrent && "coverflow-glow",
        isCurrent && !isReflection && "border-foreground",
      )}
    >
      <div className="relative flex-1 overflow-hidden bg-surface">
        <GameMedia game={game} sizes={COVER_SIZES} />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[42%] shade-cover" />
        <span className="absolute right-[10px] bottom-[10px] left-[10px] z-[1] font-wide text-[calc(var(--cw)*.085)] leading-none font-bold tracking-[-.03em] text-foreground uppercase">
          {game.name}
        </span>
      </div>
    </div>
  );
}

/** Cantos laterales de la caja (`.c-edge`). */
export function CoverflowEdges() {
  const edgeClass = "coverflow-edge absolute top-0 h-[var(--ch)] w-[var(--cd)] [backface-visibility:hidden]";

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(edgeClass, "left-[calc(var(--cd)*-1)] origin-right [transform:rotateY(-90deg)]")}
      />
      <span aria-hidden="true" className={cn(edgeClass, "left-full origin-left [transform:rotateY(90deg)]")} />
    </>
  );
}
