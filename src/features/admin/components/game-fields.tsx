import { AdminCheckboxGroup } from "@features/admin/components/admin-checkbox-group";
import { AdminSelectField } from "@features/admin/components/admin-select-field";
import { AdminTextField } from "@features/admin/components/admin-text-field";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { GameFieldOptions } from "@features/admin/lib/types";
import type { GameRecord } from "@features/games/lib/types";

interface GameFieldsProps {
  options: GameFieldOptions;
  game?: GameRecord;
}

/** Campos de un juego (alta y edición). */
export function GameFields({ options, game }: Readonly<GameFieldsProps>) {
  const copy = ADMIN_COPY.games;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
        <AdminTextField name="name" label={copy.name} defaultValue={game?.name} isRequired />
        <AdminTextField
          name="slug"
          label={copy.slug}
          placeholder={copy.slugPlaceholder}
          defaultValue={game?.slug}
          isRequired
        />
        <AdminSelectField
          name="teamId"
          label={copy.team}
          options={options.teams}
          defaultValue={game?.teamId}
          isRequired
        />
        <AdminSelectField
          name="genreId"
          label={copy.genre}
          options={options.genres}
          defaultValue={game?.genreId}
          isRequired
        />
      </div>
      <AdminTextField name="description" label={copy.description} defaultValue={game?.description} isRequired />
      <AdminTextField
        name="about"
        label={copy.about}
        description={copy.aboutHint}
        defaultValue={game?.about}
        multiline
      />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] gap-4 max-[640px]:grid-cols-1">
        <AdminTextField name="players" label={copy.players} type="number" defaultValue={game?.players ?? 1} />
        <AdminTextField name="sortOrder" label={copy.sortOrder} type="number" defaultValue={game?.sortOrder ?? 0} />
        <AdminTextField
          name="itchioUrl"
          label={copy.itchioUrl}
          type="url"
          placeholder={copy.itchioPlaceholder}
          defaultValue={game?.itchioUrl}
        />
      </div>
      <AdminCheckboxGroup
        name="platformIds"
        label={copy.platforms}
        options={options.platforms}
        defaultValue={game?.platformIds}
      />
      <AdminCheckboxGroup
        name="extraGenreIds"
        label={copy.extraGenres}
        options={options.genres}
        defaultValue={game?.extraGenreIds}
      />
    </div>
  );
}
