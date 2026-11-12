import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getZoneLink } from "@features/floor-plan/lib/floor-plan-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { SCHEDULE_SECTION_ID } from "@features/schedule/lib/schedule-links";
import { PublicBracketView } from "@features/tournament/components/public-bracket-view";
import type { PublicSnapshot } from "@features/tournament/lib/public-bracket";
import { getEntrySchedule } from "@features/tournament/lib/server/entries-queries";
import { getPublicSnapshot } from "@features/tournament/lib/server/public-bracket-queries";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { PUBLIC_BRACKET_PATH } from "@features/tournament/lib/tournament-links";

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
      <h1 className="type-section">{COPY.title}</h1>
      <Suspense fallback={<p className="type-mono text-muted">{COPY.loading}</p>}>
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
    <PublicBracketView
      initial={snapshot}
      checkInStartsAt={schedule.checkInStartsAt.toISOString()}
      checkInEndsAt={schedule.checkInEndsAt.toISOString()}
      bracketGeneratesAt={schedule.bracketGeneratesAt.toISOString()}
      kofLink={buildKofLink()}
      scheduleLink={buildScheduleLink()}
    />
  );
}

function loadSnapshot(): Promise<PublicSnapshot> {
  return getPublicSnapshot(new Date());
}

function buildKofLink() {
  const zone = getZoneLink("kof");

  if (!zone) return undefined;

  return { href: `${HOME_PATH}${zone.href}`, label: zone.label };
}

function buildScheduleLink() {
  return { href: `${HOME_PATH}#${SCHEDULE_SECTION_ID}`, label: COPY.unpublished.scheduleLink };
}
