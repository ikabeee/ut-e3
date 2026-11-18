import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@features/accounts/components/account-page-header";
import { signOut } from "@features/accounts/lib/accounts-actions";
import { requireStandAdmin } from "@features/accounts/lib/server/current-account";
import { StandGameDelete } from "@features/games/components/stand-game-delete";
import { StandGameForm } from "@features/games/components/stand-game-form";
import { StandGameImages } from "@features/games/components/stand-game-images";
import { STAND_GAME_PATH } from "@features/games/lib/games-links";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { deleteStandGameAction, saveStandGameAction } from "@features/games/lib/stand-game-actions";
import { deleteGameImageAction, uploadGameImageAction } from "@features/games/lib/stand-game-image-actions";
import { StandAdminNav } from "@features/stands/components/stand-admin-nav";
import { getStandGame, getStandGameImages, listGenres } from "@features/games/lib/server/stand-game-queries";
import { PanelSkeleton } from "@shared/components/panel-skeleton";

const COPY = GAMES_COPY.standGame;

export const standGamePageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: STAND_GAME_PATH },
  robots: { index: false, follow: false },
};

export function StandGamePage() {
  return (
    <main className="page-wrap grid gap-10 py-12">
      <Suspense fallback={<PanelSkeleton label={COPY.loading} layout="form" />}>
        <StandGamePanel />
      </Suspense>
    </main>
  );
}

// Reads the session cookie, so it streams behind the Suspense boundary. The game is the one of the stand of the session.
async function StandGamePanel() {
  await connection();

  const account = await requireStandAdmin();

  const [game, gameImages, genres] = await Promise.all([
    getStandGame(account.standId),
    getStandGameImages(account.standId),
    listGenres(),
  ]);

  return (
    <>
      <AccountPageHeader title={COPY.title} signedInAs={COPY.signedInAs(account.name)} signOutAction={signOut} />
      <StandAdminNav />
      <StandGameForm game={game} genres={genres} action={saveStandGameAction} />
      <StandGameImages game={gameImages} uploadAction={uploadGameImageAction} deleteAction={deleteGameImageAction} />
      {game ? <StandGameDelete gameName={game.name} action={deleteStandGameAction} /> : null}
    </>
  );
}
