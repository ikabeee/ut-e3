import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PublicBracketView } from "@features/tournament/components/public-bracket-view";
import type { PublicSnapshot } from "@features/tournament/lib/public-bracket";
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

  return <PublicBracketView initial={await loadSnapshot()} />;
}

function loadSnapshot(): Promise<PublicSnapshot> {
  return getPublicSnapshot(new Date());
}
