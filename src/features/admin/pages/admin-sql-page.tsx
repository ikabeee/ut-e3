import { SqlConsole } from "@features/admin/components/sql-console";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_SQL_PATH } from "@features/admin/lib/admin-links";
import { runSqlAction } from "@features/admin/lib/sql-console-actions";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";

const PAGE = ADMIN_COPY.pages.sql;

export const adminSqlPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_SQL_PATH);

export function AdminSqlPage() {
  return <AdminSectionShell title={PAGE.title} renderContent={renderSqlConsole} />;
}

// The console reads nothing at render time: the shell has already checked that the session is the sysadmin's.
async function renderSqlConsole() {
  return <SqlConsole action={runSqlAction} />;
}
