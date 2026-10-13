import { Suspense } from "react";
import { AdminPanel } from "@features/admin/components/admin-panel";
import { AdminShell } from "@features/admin/components/admin-shell";
import { AdminSkeleton } from "@features/admin/components/admin-skeleton";
import { GameCreateForm } from "@features/admin/components/game-create-form";
import { GameRecordCard } from "@features/admin/components/game-record-card";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildAdminMetadata } from "@features/admin/lib/admin-metadata";
import { getAdminGames } from "@features/admin/lib/server/admin-queries";

export const adminGamesPageMetadata = buildAdminMetadata("games");

async function AdminGamesContent() {
  const { games, options } = await getAdminGames();

  return (
    <>
      <AdminPanel title={ADMIN_COPY.games.createTitle}>
        <GameCreateForm options={options} />
      </AdminPanel>
      {games.length === 0 ? <p className="m-0 text-muted">{ADMIN_COPY.games.empty}</p> : null}
      {games.map((game) => (
        <GameRecordCard key={game.id} game={game} options={options} />
      ))}
    </>
  );
}

/** Juegos (`/admin/games`): datos, géneros, plataformas y fotos de cada juego. */
export function AdminGamesPage() {
  return (
    <AdminShell current="games">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminGamesContent />
      </Suspense>
    </AdminShell>
  );
}
