import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction } from "@features/auth/lib/auth-actions";
import { LOGIN_PATH } from "@features/auth/lib/auth-links";
import { TeamPortalLoading } from "@features/teams/components/team-portal-loading";
import { TeamPortalView } from "@features/teams/components/team-portal-view";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import type { TeamPortalData } from "@features/teams/lib/types";
import { getAuthSession, type SessionPayload } from "@shared/lib/server/session";

export const teamPortalPageMetadata: Metadata = {
  title: TEAMS_COPY.page.title,
  description: TEAMS_COPY.page.description,
  robots: { index: false, follow: false },
};

export interface TeamPortalPageDependencies {
  getSession?: () => Promise<SessionPayload | null>;
  getPortalData?: (teamId: string) => Promise<TeamPortalData | null>;
  redirectFn?: (url: string) => void;
}

const getPortalQueries = async () => import("@features/teams/lib/server/team-portal-queries");

async function TeamPortalContent({ deps }: { deps?: TeamPortalPageDependencies }) {
  const readSession = deps?.getSession ?? getAuthSession;
  const doRedirect = deps?.redirectFn ?? redirect;

  const session = await readSession();

  if (!session || session.role !== "team" || !session.teamId) {
    doRedirect(`${LOGIN_PATH}?logout=true`);

    return null;
  }

  const readPortalData = deps?.getPortalData ?? (await getPortalQueries()).getTeamPortalData;
  const data = await readPortalData(session.teamId);

  if (!data) {
    doRedirect(`${LOGIN_PATH}?logout=true`);

    return null;
  }

  return <TeamPortalView data={data} onLogout={logoutAction} />;
}

export function TeamPortalPage({ deps }: { deps?: TeamPortalPageDependencies } = {}) {
  return (
    <Suspense fallback={<TeamPortalLoading />}>
      <TeamPortalContent deps={deps} />
    </Suspense>
  );
}
