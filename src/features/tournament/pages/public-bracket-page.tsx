import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PublicBracketView } from "@features/tournament/components/public-bracket-view";
import { TournamentHeading } from "@features/tournament/components/tournament-heading";
import { TournamentInfo } from "@features/tournament/components/tournament-info";
import type { EntrySchedule } from "@features/tournament/lib/entries-rules";
import type { PublicSnapshot } from "@features/tournament/lib/public-bracket";
import { getEntrySchedule } from "@features/tournament/lib/server/entries-queries";
import { getPublicSnapshot } from "@features/tournament/lib/server/public-bracket-queries";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { PUBLIC_BRACKET_PATH } from "@features/tournament/lib/tournament-links";
import type { TournamentInfoSchedule } from "@features/tournament/lib/tournament-when";
import { PASSPORT_SNAPSHOT_KEY } from "@features/visitors/lib/passport-snapshot";
import { PASSPORT_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { LoadingState } from "@shared/components/loading-state";

const COPY = TOURNAMENT_COPY.ui.publicBracket;

export const publicBracketPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: PUBLIC_BRACKET_PATH },
  // It is live data: a search engine would keep an old copy of it.
  robots: { index: false, follow: true },
};

export function PublicBracketPage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <TournamentHeading />
      <Suspense fallback={<LoadingState label={COPY.loading} />}>
        <PublicBracket />
      </Suspense>
    </main>
  );
}

// The bracket changes with every match, so it is read at request time and then followed by polling.
async function PublicBracket() {
  await connection();

  const [snapshot, schedule] = await Promise.all([loadSnapshot(), getEntrySchedule()]);

  return (
    <>
      <TournamentInfo
        schedule={toInfoSchedule(schedule)}
        registerHref={REGISTER_PATH}
        passportHref={PASSPORT_PATH}
        passportSnapshotKey={PASSPORT_SNAPSHOT_KEY}
      />
      <PublicBracketView initial={snapshot} />
    </>
  );
}

function loadSnapshot(): Promise<PublicSnapshot> {
  return getPublicSnapshot(new Date());
}

function toInfoSchedule(schedule: EntrySchedule): TournamentInfoSchedule {
  return {
    registrationOpensAt: schedule.registrationOpensAt.toISOString(),
    checkInStartsAt: schedule.checkInStartsAt.toISOString(),
    checkInEndsAt: schedule.checkInEndsAt.toISOString(),
    onsiteStartsAt: schedule.onsiteStartsAt.toISOString(),
    onsiteEndsAt: schedule.onsiteEndsAt.toISOString(),
    bracketGeneratesAt: schedule.bracketGeneratesAt.toISOString(),
  };
}
