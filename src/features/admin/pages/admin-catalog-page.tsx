import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_CATALOG_PATH } from "@features/admin/lib/admin-links";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { GenresAdmin } from "@features/games/components/genres-admin";
import { deleteGenreAction, saveGenreAction } from "@features/games/lib/genre-admin-actions";
import { listAdminGenres } from "@features/games/lib/server/genre-admin";
import { SponsorsAdmin } from "@features/sponsors/components/sponsors-admin";
import { deleteSponsorAction, saveSponsorAction } from "@features/sponsors/lib/sponsors-admin-actions";
import { getSponsors } from "@features/sponsors/lib/server/sponsors-queries";
import { EmailBlocklistAdmin } from "@features/visitors/components/email-blocklist-admin";
import { addBlockedEmailsAction, removeBlockedEmailAction } from "@features/visitors/lib/email-blocklist-actions";
import { listBlockedEmails } from "@features/visitors/lib/server/email-blocklist";

const PAGE = ADMIN_COPY.pages.catalog;

export const adminCatalogPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_CATALOG_PATH);

export function AdminCatalogPage() {
  return <AdminSectionShell title={PAGE.title} path={ADMIN_CATALOG_PATH} renderContent={renderCatalog} />;
}

// Genres (RF-72), sponsors (RF-41) and the blocklist of team emails (RF-44).
async function renderCatalog() {
  const [genres, sponsors, blockedEmails] = await Promise.all([listAdminGenres(), getSponsors(), listBlockedEmails()]);

  return (
    <>
      <GenresAdmin genres={genres} saveAction={saveGenreAction} deleteAction={deleteGenreAction} />
      <SponsorsAdmin sponsors={sponsors} saveAction={saveSponsorAction} deleteAction={deleteSponsorAction} />
      <EmailBlocklistAdmin
        emails={blockedEmails}
        addAction={addBlockedEmailsAction}
        removeAction={removeBlockedEmailAction}
      />
    </>
  );
}
