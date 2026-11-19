import { RecoveryPanel } from "@features/admin/components/recovery-panel";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_RECOVERY_PATH } from "@features/admin/lib/admin-links";
import { getRecoveryStatus } from "@features/admin/lib/server/recovery-status";
import {
  invalidateCachesAction,
  restartEmailWorkerAction,
  restartOverloadWatchAction,
  retryEmailsAction,
  runCheckpointAction,
  runQuickCheckAction,
  testSmtpAction,
} from "@features/admin/lib/recovery-actions";
import { setPublicBracketBySysadminAction } from "@features/admin/lib/server-status-actions";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { PublicBracketSwitch } from "@features/tournament/components/public-bracket-switch";

const PAGE = ADMIN_COPY.pages.recovery;

const ACTIONS = {
  testSmtp: testSmtpAction,
  retryEmails: retryEmailsAction,
  restartEmailWorker: restartEmailWorkerAction,
  restartOverloadWatch: restartOverloadWatchAction,
  runQuickCheck: runQuickCheckAction,
  runCheckpoint: runCheckpointAction,
  invalidateCaches: invalidateCachesAction,
};

export const adminRecoveryPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_RECOVERY_PATH);

export function AdminRecoveryPage() {
  return <AdminSectionShell title={PAGE.title} path={ADMIN_RECOVERY_PATH} renderContent={renderRecovery} />;
}

// The state of the services is read on every visit; the shell has already checked that the session is the sysadmin's.
async function renderRecovery() {
  const status = await getRecoveryStatus();

  return (
    <>
      <RecoveryPanel status={status} actions={ACTIONS} refreshHref={ADMIN_RECOVERY_PATH} />
      <PublicBracketSwitch isEnabled={status.publicBracketEnabled} action={setPublicBracketBySysadminAction} />
    </>
  );
}
