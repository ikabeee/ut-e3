import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_VISITORS_PATH } from "@features/admin/lib/admin-links";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { unexcludeVisitorAction } from "@features/moderation/lib/moderation-actions";
import type { VisitorAdminActions } from "@features/visitors/components/visitor-row-actions";
import { VisitorsAdminPanel } from "@features/visitors/components/visitors-admin-panel";
import { getRegistrationsPerDay, listAdminVisitors } from "@features/visitors/lib/server/visitors-admin-queries";
import { parseVisitorListParams } from "@features/visitors/lib/visitors-admin";
import {
  resendPassportAction,
  sendRecoveryLinkAction,
  updateVisitorAction,
} from "@features/visitors/lib/visitors-admin-actions";

const PAGE = ADMIN_COPY.pages.visitors;

const ACTIONS: VisitorAdminActions = {
  resend: resendPassportAction,
  recovery: sendRecoveryLinkAction,
  update: updateVisitorAction,
  unexclude: unexcludeVisitorAction,
};

export const adminVisitorsPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_VISITORS_PATH);

export function AdminVisitorsPage({ searchParams }: Readonly<PageProps<"/admin/visitors">>) {
  return (
    <AdminSectionShell
      title={PAGE.title}

      renderContent={() => renderVisitors(searchParams)}
    />
  );
}

// The list changes with every registration, so it is read on each visit, after the session was checked.
async function renderVisitors(searchParams: PageProps<"/admin/visitors">["searchParams"]) {
  const params = parseVisitorListParams(await searchParams);
  const [page, perDay] = await Promise.all([listAdminVisitors(params), getRegistrationsPerDay()]);

  return (
    <VisitorsAdminPanel basePath={ADMIN_VISITORS_PATH} params={params} page={page} perDay={perDay} actions={ACTIONS} />
  );
}
