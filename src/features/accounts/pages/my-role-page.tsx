import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { MyRoleCards } from "@features/accounts/components/my-role-cards";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { LOGIN_PATH, MY_ROLE_PATH } from "@features/accounts/lib/accounts-links";
import { buildMyRoleCards, type MyRoleContext } from "@features/accounts/lib/my-role";
import { getMyRoleDetails, type MyRoleDetails } from "@features/accounts/lib/server/my-role-queries";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { getZoneLink } from "@features/floor-plan/lib/floor-plan-links";
import { STAND_GAME_PATH } from "@features/games/lib/games-links";
import { formatAdminStandCode } from "@features/games/lib/stand-code";
import { EventSchedule } from "@features/schedule/components/event-schedule";
import { getScheduleItems } from "@features/schedule/lib/server/schedule-queries";
import { STAND_TEAM_PATH } from "@features/stands/lib/stands-links";
import { PanelSkeleton } from "@shared/components/panel-skeleton";
import { formatEventDate } from "@shared/lib/date-time";
import { getSessionAccount } from "@shared/lib/server/session";

const COPY = ACCOUNTS_COPY.myRole;

export const myRolePageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: MY_ROLE_PATH },
  robots: { index: false, follow: false },
};

export function MyRolePage() {
  return (
    <main>
      <Suspense fallback={<PanelSkeleton label={COPY.loading} />}>
        <MyRolePanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie, so it streams behind the Suspense boundary. Any staff role opens it; the session is checked
// in the database here, because the proxy only looks for the cookie.
async function MyRolePanel() {
  await connection();

  const account = await getSessionAccount();

  if (!account) redirect(LOGIN_PATH);

  const [details, settings, scheduleItems] = await Promise.all([
    getMyRoleDetails(account.id),
    getEventSettings(),
    getScheduleItems(),
  ]);

  return (
    <>
      <div className="page-wrap grid gap-10 py-12">
        <AccountPageHeader
          title={COPY.title}
          signedInAs={COPY.signedInAs(account.name)}
          signOutAction={signOut}
          showRoleLink={false}
        />
        <p className="text-muted">{COPY.intro}</p>
        <MyRoleCards cards={buildMyRoleCards(account.roles, toContext(details))} />
      </div>
      <h2 className="sr-only">{COPY.scheduleHeading}</h2>
      <EventSchedule
        heading={formatEventDate(settings.eventStartsAt, "2-digit")}
        items={scheduleItems}
        zoneLabel={getZoneLabel}
      />
    </>
  );
}

function toContext({ stand, kofDesk }: MyRoleDetails): MyRoleContext {
  return {
    kofDesk,
    paths: { standGame: STAND_GAME_PATH, standTeam: STAND_TEAM_PATH },
    stand: stand && { code: formatAdminStandCode(stand), gameName: stand.gameName, adminName: stand.adminName },
  };
}

// The schedule names the place of an activity as plain text, like the landing does.
function getZoneLabel(zone: string): string | null {
  return getZoneLink(zone)?.label ?? null;
}
