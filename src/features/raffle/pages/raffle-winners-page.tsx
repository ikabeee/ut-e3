import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { RaffleWinnersList } from "@features/raffle/components/raffle-winners-list";
import { RaffleWinnersHeader } from "@features/raffle/components/raffle-winners-header";
import { RAFFLE_COPY } from "@features/raffle/lib/raffle-copy";
import { RAFFLE_WINNERS_PATH } from "@features/raffle/lib/raffle-links";
import { listPublicRaffleWinners } from "@features/raffle/lib/server/raffle-queries";
import { buildOpenGraph } from "@shared/lib/metadata";

const COPY = RAFFLE_COPY.winners;

export const raffleWinnersPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: RAFFLE_WINNERS_PATH },
  openGraph: buildOpenGraph({ title: COPY.title, description: COPY.description, url: RAFFLE_WINNERS_PATH }),
};

/** The public section of confirmed winners (RF-56). */
export function RaffleWinnersPage() {
  return (
    <main className="page-wrap grid max-w-3xl gap-8 py-12">
      <RaffleWinnersHeader />
      <Suspense fallback={<p className="m-0 text-center type-mono text-muted">{COPY.loading}</p>}>
        <Winners />
      </Suspense>
    </main>
  );
}

// A winner can be confirmed at any moment of the raffle, so the list is read at request time.
async function Winners() {
  await connection();

  return <RaffleWinnersList winners={await listPublicRaffleWinners()} />;
}
