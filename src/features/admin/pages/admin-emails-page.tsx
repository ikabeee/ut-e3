import { EmailsPanel } from "@features/admin/components/emails-panel";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_EMAILS_PATH } from "@features/admin/lib/admin-links";
import { parseEmailFilters } from "@features/admin/lib/email-filters";
import {
  rebuildEmailAction,
  resendFailedEmailsAction,
  resendOneEmailAction,
  sendNowAction,
  viewEmailTextAction,
} from "@features/admin/lib/emails-actions";
import { countResendableFailed, listEmails } from "@features/admin/lib/server/email-queries";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { getOutboxSummary } from "@shared/lib/server/email-outbox-status";

const PAGE = ADMIN_COPY.pages.emails;

const ACTIONS = {
  resend: resendOneEmailAction,
  rebuild: rebuildEmailAction,
  view: viewEmailTextAction,
  resendFailed: resendFailedEmailsAction,
  sendNow: sendNowAction,
};

export const adminEmailsPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_EMAILS_PATH);

export function AdminEmailsPage({ searchParams }: Readonly<PageProps<"/admin/emails">>) {
  return (
    <AdminSectionShell title={PAGE.title} path={ADMIN_EMAILS_PATH} renderContent={() => renderEmails(searchParams)} />
  );
}

// The outbox changes with every email, so it is read on every visit; the filters come from the URL.
async function renderEmails(searchParams: PageProps<"/admin/emails">["searchParams"]) {
  const filters = parseEmailFilters(await searchParams);

  const [summary, resendableFailed, emails] = await Promise.all([
    getOutboxSummary(),
    countResendableFailed(),
    listEmails(filters),
  ]);

  return (
    <EmailsPanel
      summary={summary}
      resendableFailed={resendableFailed}
      emails={emails}
      filters={filters}
      actions={ACTIONS}
    />
  );
}
