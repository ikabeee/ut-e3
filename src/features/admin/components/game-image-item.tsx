import { AdminActionButton } from "@features/admin/components/admin-action-button";
import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { AdminDisclosure } from "@features/admin/components/admin-disclosure";
import { GameImageFields } from "@features/admin/components/game-image-fields";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { toCoverImageInput } from "@features/admin/lib/admin-records";
import { GameImageView } from "@features/games/components/game-image-view";
import { deleteGameImageAction, updateGameImageAction } from "@features/games/lib/games-actions";
import type { GameImageRecord } from "@features/games/lib/types";

interface GameImageItemProps {
  image: GameImageRecord;
}

/** Una foto de un juego: miniatura, portada, edición y borrado. */
export function GameImageItem({ image }: Readonly<GameImageItemProps>) {
  const copy = ADMIN_COPY.games;

  return (
    <li className="flex flex-col gap-3 border border-border p-3">
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative aspect-video w-40 shrink-0 bg-surface">
          <GameImageView
            image={{ src: image.imageUrl, alt: image.altText, position: image.cropPosition }}
            alt={image.altText}
            sizes="160px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-tiny text-muted">
            #{image.sortOrder}
            {image.isCover ? <span className="text-accent"> · {copy.cover}</span> : null}
          </span>
          <p className="m-0 text-sm break-words">{image.altText}</p>
          <div className="flex flex-wrap gap-2">
            {image.isCover ? null : (
              <AdminActionButton
                action={updateGameImageAction.bind(null, image.id, toCoverImageInput(image))}
                label={copy.makeCover}
              />
            )}
            <AdminActionButton
              action={deleteGameImageAction.bind(null, image.id)}
              label={ADMIN_COPY.common.delete}
              confirmLabel={ADMIN_COPY.common.confirmDelete}
              variant="tertiary"
            />
          </div>
        </div>
      </div>
      <AdminDisclosure label={ADMIN_COPY.common.edit}>
        <AdminActionForm
          action={updateGameImageAction.bind(null, image.id)}
          submitLabel={ADMIN_COPY.common.save}
          successMessage={ADMIN_COPY.common.saved}
        >
          <GameImageFields image={image} />
        </AdminActionForm>
      </AdminDisclosure>
    </li>
  );
}
