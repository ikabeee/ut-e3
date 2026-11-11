import { ServerStatusPanel } from "@features/admin/components/server-status-panel";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_SERVER_PATH } from "@features/admin/lib/admin-links";
import { getServerStatus } from "@features/admin/lib/server/server-status";
import { resendEmailAction, setPublicBracketBySysadminAction } from "@features/admin/lib/server-status-actions";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { PublicBracketSwitch } from "@features/tournament/components/public-bracket-switch";

const PAGE = ADMIN_COPY.pages.server;

export const adminServerPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_SERVER_PATH);

export function AdminServerPage() {
  return <AdminSectionShell title={PAGE.title} path={ADMIN_SERVER_PATH} renderContent={renderServer} />;
}

// Memory, CPU, the audience of the live bracket and the outbox, read on every visit (RF-73), and the switch of RF-74.
async function renderServer() {
  const status = await getServerStatus();

  return (
    <>
      <ServerStatusPanel status={status} refreshHref={ADMIN_SERVER_PATH} resendAction={resendEmailAction} />
      <PublicBracketSwitch isEnabled={status.bracket.publicBracketEnabled} action={setPublicBracketBySysadminAction} />
    </>
  );
}
