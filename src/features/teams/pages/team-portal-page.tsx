import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction } from "@features/auth/lib/auth-actions";
import { LOGIN_PATH } from "@features/auth/lib/auth-links";
import { TeamPortalLoading } from "@features/teams/components/team-portal-loading";
import { TeamPortalView } from "@features/teams/components/team-portal-view";
import { getTeamPortalData } from "@features/teams/lib/server/team-portal-queries";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import { getAuthSession } from "@shared/lib/server/session";

export const teamPortalPageMetadata: Metadata = {
  title: TEAMS_COPY.page.title,
  description: TEAMS_COPY.page.description,
  robots: { index: false, follow: false },
};

async function TeamPortalContent() {
  const session = await getAuthSession();

  if (!session || session.role !== "team" || !session.teamId) {
    redirect(`${LOGIN_PATH}?logout=true`);
  }

  const data = await getTeamPortalData(session.teamId);

  if (!data) {
    redirect(`${LOGIN_PATH}?logout=true`);
  }

  return <TeamPortalView data={data} onLogout={logoutAction} />;
}

export function TeamPortalPage() {
  return (
    <Suspense fallback={<TeamPortalLoading />}>
      <TeamPortalContent />
    </Suspense>
  );
}
