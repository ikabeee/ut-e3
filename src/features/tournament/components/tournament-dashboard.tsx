"use client";

import type { TournamentAction } from "@features/tournament/components/command-button";
import { BracketSection } from "@features/tournament/components/bracket-section";
import { TournamentLog } from "@features/tournament/components/tournament-log";
import { useTournament, type SnapshotLoader } from "@features/tournament/hooks/use-tournament";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { KofActor } from "@features/tournament/lib/tournament-rules";
import {
  getChampionTag,
  getSections,
  getStatusCounts,
  type StatusCounts,
} from "@features/tournament/lib/tournament-view";
import type { Tournament } from "@features/tournament/lib/types";

interface TournamentDashboardProps {
  /** What the server rendered; the screen keeps it fresh by polling. */
  initial: Tournament | null;
  viewer: KofActor;
  action: TournamentAction;
  /** Replaces the Route Handler request; the tests use it. */
  load?: SnapshotLoader;
}

interface BracketBoardProps {
  tournament: Tournament;
  viewer: KofActor;
  action: TournamentAction;
  onApplied: () => void;
}

const COPY = TOURNAMENT_COPY.ui;

const STATUS_ORDER: readonly (keyof StatusCounts)[] = ["ready", "active", "frozen", "finished"];

export function TournamentDashboard({ initial, viewer, action, load }: Readonly<TournamentDashboardProps>) {
  const { tournament, hasConnectionError, refresh } = useTournament(initial, load);

  return (
    <div className="grid gap-8">
      {hasConnectionError && (
        <p role="status" className="border border-danger p-3 text-sm text-danger">
          {COPY.connectionLost}
        </p>
      )}
      {tournament ? (
        <BracketBoard tournament={tournament} viewer={viewer} action={action} onApplied={refresh} />
      ) : (
        <p className="type-mono text-muted">{COPY.notGenerated}</p>
      )}
    </div>
  );
}

function BracketBoard({ tournament, viewer, action, onApplied }: Readonly<BracketBoardProps>) {
  const isAdmin = viewer.role === "kof_admin";
  const sections = getSections(tournament, { isAdmin, desk: viewer.desk });

  if (!isAdmin && viewer.desk === null) return <p className="type-mono text-muted">{COPY.noDesk}</p>;

  return (
    <>
      {tournament.phase === "finished" && <ChampionBanner tag={getChampionTag(tournament)} />}
      <StatusSummary counts={getStatusCounts(sections.flatMap((section) => section.matches))} />
      {sections.map((section) => (
        <BracketSection
          key={section.area}
          section={section}
          tournament={tournament}
          viewer={viewer}
          action={action}
          onApplied={onApplied}
        />
      ))}
      {isAdmin && <TournamentLog entries={tournament.log} />}
    </>
  );
}

function ChampionBanner({ tag }: Readonly<{ tag: string | null }>) {
  return (
    <p role="status" className="border border-accent p-4 type-mono font-bold">
      {tag ? COPY.champion(tag) : COPY.noChampion}
    </p>
  );
}

function StatusSummary({ counts }: Readonly<{ counts: StatusCounts }>) {
  return (
    <ul aria-label={COPY.summaryLabel} className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
      {STATUS_ORDER.map((status) => (
        <li key={status} className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-bold tabular-nums">{counts[status]}</span>
          <span className="type-tiny text-muted">{COPY.summary[status]}</span>
        </li>
      ))}
    </ul>
  );
}
