import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ConnectionIndicator } from "@features/pwa/components/connection-indicator";
import { InstallAppPrompt } from "@features/pwa/components/install-app-prompt";
import { RaffleWinNotice } from "@features/raffle/components/raffle-win-notice";
import { getVisitorRaffleWin } from "@features/raffle/lib/server/raffle-queries";
import { RejectedVisitNotices } from "@features/stands/components/rejected-visit-notices";
import { VisitSurveyPrompt } from "@features/stands/components/visit-survey-prompt";
import { getRejectedVisitNotices } from "@features/stands/lib/server/rejected-visit-queries";
import { answerVisitAction } from "@features/stands/lib/stands-actions";
import { TournamentNotice } from "@features/tournament/components/tournament-notice";
import { getEntrySchedule, getVisitorEntryStatus } from "@features/tournament/lib/server/entries-queries";
import { getGames } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { PassportExplorer } from "@features/visitors/components/passport-explorer";
import { PassportSections } from "@features/visitors/components/passport-sections";
import { PassportSnapshotSaver } from "@features/visitors/components/passport-snapshot-saver";
import { getPassport } from "@features/visitors/lib/server/passport-queries";
import { getPassportVisits } from "@features/visitors/lib/server/passport-visits-queries";
import type { Passport, PassportVisits } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { LoadingState } from "@shared/components/loading-state";
import { getDeviceVisitorId } from "@shared/lib/server/visitor-device";

export const passportPageMetadata: Metadata = {
  title: VISITORS_COPY.passport.title,
  description: VISITORS_COPY.passport.subtitle,
  alternates: { canonical: PASSPORT_PATH },
  robots: { index: false },
};

interface PassportViewProps {
  passport: Passport;
  visits: PassportVisits;
  /** The games of the stands, for the map and the detail of the stand the visitor selects. */
  games: readonly Game[];
  /** What this page composes under the card, such as the tournament notice. */
  extra?: ReactNode;
}

export function PassportPage() {
  return (
    <Suspense fallback={<LoadingState label={VISITORS_COPY.loading.passport} className="justify-center py-24" />}>
      <PassportGate />
    </Suspense>
  );
}

// Device identity is resolved from the device cookie at request time.
async function PassportGate() {
  await connection();

  const visitorId = await getDeviceVisitorId();

  if (!visitorId) {
    redirect(REGISTER_PATH);
  }

  const [passport, visits, rejectedVisits, games] = await Promise.all([
    getPassport(visitorId),
    getPassportVisits(visitorId),
    getRejectedVisitNotices(visitorId),
    getGames(),
  ]);

  if (!passport) {
    redirect(REGISTER_PATH);
  }

  return (
    <PassportView
      passport={passport}
      visits={visits}
      games={games}
      extra={
        <>
          {await loadRaffleWin(visitorId)}
          <RejectedVisitNotices notices={rejectedVisits} />
          <VisitSurveyPrompt answerVisit={answerVisitAction} />
          {await loadTournamentNotice(visitorId)}
        </>
      }
    />
  );
}

// "Ganaste" only exists for a confirmed winner of the raffle (RF-25); the prize appears once it is registered.
async function loadRaffleWin(visitorId: string): Promise<ReactNode> {
  const win = await getVisitorRaffleWin(visitorId);

  return win ? <RaffleWinNotice win={win} /> : null;
}

// The page is where the visitors and tournament features meet: the notice only exists for a player that entered (RF-75).
async function loadTournamentNotice(visitorId: string): Promise<ReactNode> {
  const status = await getVisitorEntryStatus(visitorId);

  if (!status) return null;

  const schedule = await getEntrySchedule();

  return (
    <TournamentNotice
      status={status}
      checkInStartsAt={schedule.checkInStartsAt.toISOString()}
      checkInEndsAt={schedule.checkInEndsAt.toISOString()}
    />
  );
}

// Phone: passport, map, detail, one under the other. From 1000 px the passport is a column beside the map panel.
export function PassportView({ passport, visits, games, extra }: Readonly<PassportViewProps>) {
  return (
    <main className="page-wrap grid min-h-[calc(100svh-var(--nav-height))] grid-cols-1 content-start gap-8 py-10 min-[1000px]:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] min-[1000px]:items-start min-[1000px]:gap-10 min-[1000px]:py-14">
      <header className="flex flex-col items-center gap-2 text-center min-[1000px]:col-span-full min-[1000px]:items-start min-[1000px]:text-left">
        <h1 className="type-section">{VISITORS_COPY.passport.title}</h1>
        <p className="text-muted">{VISITORS_COPY.passport.subtitle}</p>
        <ConnectionIndicator />
      </header>

      <section
        aria-label={VISITORS_COPY.passport.explorer.passportLabel}
        className="flex min-w-0 flex-col items-center gap-8"
      >
        <PassportSections passport={passport} visits={visits} extra={extra} />
        <InstallAppPrompt />
      </section>
      <PassportExplorer games={games} stands={visits.stands} />
      <PassportSnapshotSaver passport={passport} visits={visits} />
    </main>
  );
}
