import { Suspense } from "react";
import { AdminShell } from "@features/admin/components/admin-shell";
import { AdminSkeleton } from "@features/admin/components/admin-skeleton";
import { CatalogOptionList } from "@features/admin/components/catalog-option-list";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { buildAdminMetadata } from "@features/admin/lib/admin-metadata";
import { getAdminCatalog } from "@features/admin/lib/server/admin-queries";
import {
  createGenreAction,
  createPlatformAction,
  deleteGenreAction,
  deletePlatformAction,
  updateGenreAction,
  updatePlatformAction,
} from "@features/games/lib/games-actions";

export const adminCatalogPageMetadata = buildAdminMetadata("catalog");

async function AdminCatalogContent() {
  const { genres, platforms } = await getAdminCatalog();
  const copy = ADMIN_COPY.catalog;
  return (
    <div className="grid grid-cols-2 items-start gap-[clamp(16px,2vw,24px)] max-[900px]:grid-cols-1">
      <CatalogOptionList
        title={copy.genresTitle}
        options={genres}
        createLabel={copy.createGenre}
        createAction={createGenreAction}
        updateAction={updateGenreAction}
        deleteAction={deleteGenreAction}
      />
      <CatalogOptionList
        title={copy.platformsTitle}
        options={platforms}
        createLabel={copy.createPlatform}
        createAction={createPlatformAction}
        updateAction={updatePlatformAction}
        deleteAction={deletePlatformAction}
      />
    </div>
  );
}

/** Géneros y plataformas (`/admin/catalog`) que se eligen en cada juego. */
export function AdminCatalogPage() {
  return (
    <AdminShell current="catalog">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminCatalogContent />
      </Suspense>
    </AdminShell>
  );
}
