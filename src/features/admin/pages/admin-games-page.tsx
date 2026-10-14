import { Suspense } from "react";
import { Boxes3 } from "@gravity-ui/icons";
import { logoutAction } from "@features/auth/lib/auth-actions";
import { AdminShell } from "@features/admin/components/admin-shell";
import { AdminSkeleton } from "@features/admin/components/admin-skeleton";
import { GameRecordCard } from "@features/admin/components/game-record-card";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildAdminMetadata } from "@features/admin/lib/admin-metadata";
import { getAdminGames } from "@features/admin/lib/server/admin-queries";
import { EmptyState } from "@shared/components/empty-state";

export const adminGamesPageMetadata = buildAdminMetadata("games");

async function AdminGamesContent() {
  const { games, options } = await getAdminGames();

  return (
    <>
      {games.length === 0 ? <EmptyState icon={Boxes3} title={ADMIN_COPY.games.empty} /> : null}
      {games.map((game) => (
        <GameRecordCard key={game.id} game={game} options={options} />
      ))}
    </>
  );
}

/** Juegos (`/admin/games`): datos, géneros, plataformas y fotos de cada juego. */
export function AdminGamesPage() {
  return (
    <AdminShell current="games" onLogout={logoutAction}>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminGamesContent />
      </Suspense>
    </AdminShell>
  );
}
