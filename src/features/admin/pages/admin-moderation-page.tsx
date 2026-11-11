import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_MODERATION_PATH } from "@features/admin/lib/admin-links";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { FraudAlertsPanel } from "@features/moderation/components/fraud-alerts-panel";
import { VisitorModeration, type ModerationActions } from "@features/moderation/components/visitor-moderation";
import { annulCheckInAction, excludeVisitorAction } from "@features/moderation/lib/moderation-actions";
import { findModerationVisitor, getFraudAlerts } from "@features/moderation/lib/server/moderation-queries";

const PAGE = ADMIN_COPY.pages.moderation;

const ACTIONS: ModerationActions = { annul: annulCheckInAction, exclude: excludeVisitorAction };

export const adminModerationPageMetadata = buildAdminSectionMetadata(PAGE, ADMIN_MODERATION_PATH);

export function AdminModerationPage({ searchParams }: Readonly<PageProps<"/admin/moderation">>) {
  return (
    <AdminSectionShell
      title={PAGE.title}
      path={ADMIN_MODERATION_PATH}
      renderContent={() => renderModeration(searchParams)}
    />
  );
}

// `?q=` finds a passport (RF-46); the search goes first because the list of alerts grows during the event. The
// alerts are read on every visit: they change with each vote (RF-45).
async function renderModeration(searchParams: PageProps<"/admin/moderation">["searchParams"]) {
  const query = readQuery((await searchParams).q);

  const [alerts, visitor] = await Promise.all([
    getFraudAlerts(),
    query ? findModerationVisitor(query) : Promise.resolve(undefined),
  ]);

  return (
    <>
      <VisitorModeration query={query} visitor={visitor} actions={ACTIONS} />
      <FraudAlertsPanel alerts={alerts} />
    </>
  );
}

function readQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 120) ?? "";
}
