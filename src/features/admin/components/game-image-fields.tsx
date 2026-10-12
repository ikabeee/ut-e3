import { AdminCheckbox } from "@features/admin/components/admin-checkbox";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { GameImageRecord } from "@features/games/lib/types";

interface GameImageFieldsProps {
  image?: GameImageRecord;
  /** Posición sugerida para una foto nueva (al final de la galería). */
  nextSortOrder?: number;
}

/** Campos de una foto de un juego (alta y edición). */
export function GameImageFields({ image, nextSortOrder = 0 }: Readonly<GameImageFieldsProps>) {
  const copy = ADMIN_COPY.games;
  return (
    <div className="flex flex-col gap-4">
      <AdminTextField
        name="imageUrl"
        label={copy.imageUrl}
        description={copy.imageUrlHint}
        defaultValue={image?.imageUrl}
        isRequired
      />
      <AdminTextField name="altText" label={copy.altText} defaultValue={image?.altText} isRequired />
      <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
        <AdminTextField
          name="cropPosition"
          label={copy.cropPosition}
          description={copy.cropPositionHint}
          defaultValue={image?.cropPosition}
        />
        <AdminTextField
          name="sortOrder"
          label={copy.imagePosition}
          type="number"
          defaultValue={image?.sortOrder ?? nextSortOrder}
        />
      </div>
      <AdminCheckbox name="isCover" label={copy.isCover} defaultSelected={image?.isCover ?? false} />
    </div>
  );
}
