import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_MODERATION_PATH } from "@features/admin/lib/admin-links";
import { AdminSectionShell, buildAdminSectionMetadata } from "@features/admin/pages/admin-section-shell";
import { StandVisitsPanel } from "@features/moderation/components/stand-visits-panel";
import { FraudAlertsPanel } from "@features/moderation/components/fraud-alerts-panel";
import { VisitorModeration, type ModerationActions } from "@features/moderation/components/visitor-moderation";
import {
  annulCheckInAction,
  excludeVisitorAction,
  moderateSelectionAction,
} from "@features/moderation/lib/moderation-actions";
import {
  findModerationVisitor,
  getFraudAlerts,
  getStandVisits,
  listModerationStands,
  STAND_VISIT_LIMIT,
} from "@features/moderation/lib/server/moderation-queries";

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
  const params = await searchParams;
  const query = readQuery(params.q);
  const standId = readQuery(params.stand);

  const [alerts, visitor, stands, standVisits] = await Promise.all([
    getFraudAlerts(),
    query ? findModerationVisitor(query) : Promise.resolve(undefined),
    listModerationStands(),
    standId ? getStandVisits(standId) : Promise.resolve(undefined),
  ]);

  return (
    <>
      <VisitorModeration query={query} visitor={visitor} actions={ACTIONS} />
      <FraudAlertsPanel alerts={alerts} moderateSelection={moderateSelectionAction} />
      <StandVisitsPanel
        stands={stands}
        standId={standId}
        visits={standVisits}
        limit={STAND_VISIT_LIMIT}
        action={moderateSelectionAction}
      />
    </>
  );
}

function readQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 120) ?? "";
}
