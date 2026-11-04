import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ConnectionIndicator } from "@features/pwa/components/connection-indicator";
import { InstallAppPrompt } from "@features/pwa/components/install-app-prompt";
import { RejectedVisitNotices } from "@features/stands/components/rejected-visit-notices";
import { VisitSurveyPrompt } from "@features/stands/components/visit-survey-prompt";
import { getRejectedVisitNotices } from "@features/stands/lib/server/rejected-visit-queries";
import { answerVisitAction } from "@features/stands/lib/stands-actions";
import { TournamentNotice } from "@features/tournament/components/tournament-notice";
import { getEntrySchedule, getVisitorEntryStatus } from "@features/tournament/lib/server/entries-queries";
import { PassportSections } from "@features/visitors/components/passport-sections";
import { PassportSnapshotSaver } from "@features/visitors/components/passport-snapshot-saver";
import { getPassport } from "@features/visitors/lib/server/passport-queries";
import { getPassportVisits } from "@features/visitors/lib/server/passport-visits-queries";
import type { Passport, PassportVisits } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";
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
  /** What this page composes under the card, such as the tournament notice. */
  extra?: ReactNode;
}

export function PassportPage() {
  return (
    <Suspense>
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

  const [passport, visits, rejectedVisits] = await Promise.all([
    getPassport(visitorId),
    getPassportVisits(visitorId),
    getRejectedVisitNotices(visitorId),
  ]);

  if (!passport) {
    redirect(REGISTER_PATH);
  }

  return (
    <PassportView
      passport={passport}
      visits={visits}
      extra={
        <>
          <RejectedVisitNotices notices={rejectedVisits} />
          <VisitSurveyPrompt answerVisit={answerVisitAction} />
          {await loadTournamentNotice(visitorId)}
        </>
      }
    />
  );
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

export function PassportView({ passport, visits, extra }: Readonly<PassportViewProps>) {
  return (
    <main className="page-wrap flex min-h-svh flex-col items-center gap-8 py-16">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="type-section">{VISITORS_COPY.passport.title}</h1>
        <p className="text-muted">{VISITORS_COPY.passport.subtitle}</p>
      </header>

      <ConnectionIndicator />
      <PassportSections passport={passport} visits={visits} extra={extra} />
      <InstallAppPrompt />
      <PassportSnapshotSaver passport={passport} visits={visits} />
    </main>
  );
}
