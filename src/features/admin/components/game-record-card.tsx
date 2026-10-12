import { ActionLink } from "@shared/components/action-link";
import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminDisclosure } from "@features/admin/components/admin-disclosure";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { GameFields } from "@features/admin/components/game-fields";
import { GameImageFields } from "@features/admin/components/game-image-fields";
import { GameImageItem } from "@features/admin/components/game-image-item";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { getNextImageSortOrder, isGameVisible } from "@features/admin/lib/admin-records";
import type { GameFieldOptions } from "@features/admin/lib/types";
import { addGameImageAction, deleteGameAction, updateGameAction } from "@features/games/lib/games-actions";
import { getGamePath } from "@features/games/lib/game-links";
import type { GameRecord } from "@features/games/lib/types";

interface GameRecordCardProps {
  game: GameRecord;
  options: GameFieldOptions;
}

/** Un juego en el panel: estado en el sitio, datos, fotos y borrado. */
export function GameRecordCard({ game, options }: Readonly<GameRecordCardProps>) {
  const copy = ADMIN_COPY.games;
  const visible = isGameVisible(game);
  const teamName = options.teams.find((team) => team.value === game.teamId)?.label ?? "";

  return (
    <AdminPanel title={game.name} hint={`${teamName} · ${visible ? copy.visible : copy.hidden}`}>
      {visible ? (
        <ActionLink href={getGamePath(game.slug)} arrow="ne" className="self-start">
          {copy.viewOnSite}
        </ActionLink>
      ) : null}

      <AdminDisclosure label={ADMIN_COPY.common.edit}>
        <AdminActionForm
          action={updateGameAction.bind(null, game.id)}
          submitLabel={ADMIN_COPY.common.save}
          successMessage={ADMIN_COPY.common.saved}
        >
          <GameFields options={options} game={game} />
        </AdminActionForm>
      </AdminDisclosure>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <h3 className="m-0 type-tiny text-muted">{copy.images}</h3>
        {game.images.length === 0 ? <p className="m-0 text-sm text-muted">{copy.noImages}</p> : null}
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {game.images.map((image) => (
            <GameImageItem key={image.id} image={image} />
          ))}
        </ul>
        <AdminDisclosure label={copy.addImage}>
          <AdminActionForm
            action={addGameImageAction.bind(null, game.id)}
            submitLabel={copy.addImage}
            successMessage={copy.imageAdded}
            resetOnSuccess
          >
            <GameImageFields nextSortOrder={getNextImageSortOrder(game.images)} />
          </AdminActionForm>
        </AdminDisclosure>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <AdminActionButton
          action={deleteGameAction.bind(null, game.id)}
          label={ADMIN_COPY.common.delete}
          confirmLabel={ADMIN_COPY.common.confirmDelete}
          variant="danger"
        />
      </div>
    </AdminPanel>
  );
}
