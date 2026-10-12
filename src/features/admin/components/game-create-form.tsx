import { AdminActionForm } from "@features/admin/components/admin-action-form";
import { GameFields } from "@features/admin/components/game-fields";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { GameFieldOptions } from "@features/admin/lib/types";
import { createGameAction } from "@features/games/lib/games-actions";

interface GameCreateFormProps {
  options: GameFieldOptions;
}

/** Alta de un juego. Las fotos se agregan después, desde su tarjeta. */
export function GameCreateForm({ options }: Readonly<GameCreateFormProps>) {
  if (options.teams.length === 0 || options.genres.length === 0) {
    return <p className="m-0 text-sm text-muted">{ADMIN_COPY.games.noTeams}</p>;
  }

  return (
    <AdminActionForm
      action={createGameAction}
      submitLabel={ADMIN_COPY.games.create}
      successMessage={ADMIN_COPY.games.created}
      resetOnSuccess
    >
      <GameFields options={options} />
    </AdminActionForm>
  );
}
