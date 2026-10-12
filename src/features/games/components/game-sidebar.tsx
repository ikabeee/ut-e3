import { Chip } from "@heroui/react";
import { GameMedia } from "@features/games/components/game-media";
import { getGameFacts } from "@features/games/lib/game-details";
import { getStandMapPath } from "@features/games/lib/game-links";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";
import { ActionLink } from "@shared/components/action-link";

interface GameSidebarProps {
  game: Game;
  eventDateLabel: string;
  admissionLabel: string;
  calendarUrl: string;
}

/**
 * Columna lateral fija: portada, acceso, acciones y ficha (`.jg-side`). "Ver en el croquis" sólo
 * aparece cuando el equipo ya tiene stand y "Jugar en itch.io" cuando el juego está publicado.
 */
export function GameSidebar({ game, eventDateLabel, admissionLabel, calendarUrl }: Readonly<GameSidebarProps>) {
  return (
    <aside className="sticky top-[calc(env(safe-area-inset-top,0px)+76px)] flex flex-col gap-3 max-[980px]:static max-[980px]:-order-1">
      <div className="relative aspect-[3/4] max-w-full overflow-hidden border border-border bg-surface max-[980px]:hidden">
        <GameMedia game={game} sizes="320px" />
      </div>
      <Chip className="h-6 self-start rounded-none border border-border px-[9px] py-0 type-tiny font-normal">
        {GAMES_COPY.features.demo}
      </Chip>
      <p className="m-0 font-wide text-lg font-bold uppercase">{admissionLabel}</p>
      {game.stand ? (
        <ActionLink href={getStandMapPath(game.stand)} variant="primary" arrow="ne" fullWidth>
          {GAMES_COPY.sidebar.viewOnMap}
        </ActionLink>
      ) : null}
      {game.itchioUrl ? (
        <ActionLink href={game.itchioUrl} arrow="ne" isExternal fullWidth>
          {GAMES_COPY.sidebar.playOnItchio}
        </ActionLink>
      ) : null}
      <ActionLink href={calendarUrl} arrow="ne" isExternal fullWidth>
        {GAMES_COPY.sidebar.attend}
      </ActionLink>
      <dl className="mt-[6px] mb-0 flex flex-col max-[980px]:hidden">
        {getGameFacts(game, eventDateLabel).map((fact) => (
          <div key={fact.label} className="flex justify-between gap-3 border-b border-separator py-[11px]">
            <dt className="font-mono text-xs text-muted uppercase">{fact.label}</dt>
            <dd className="m-0 text-right font-mono text-xs uppercase">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
