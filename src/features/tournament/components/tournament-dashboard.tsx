"use client";

import type { TournamentAction } from "@features/tournament/components/command-button";
import { BracketSection } from "@features/tournament/components/bracket-section";
import { ConnectionToast } from "@features/tournament/components/connection-toast";
import { TournamentLog } from "@features/tournament/components/tournament-log";
import { POLL_INTERVAL_MS, useTournament, type SnapshotLoader } from "@features/tournament/hooks/use-tournament";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { getMatchDesk, type KofActor } from "@features/tournament/lib/tournament-rules";
import {
  getChampionTag,
  getLiveMatches,
  getMatchPlayers,
  getSections,
  getStatusCounts,
  type StatusCounts,
} from "@features/tournament/lib/tournament-view";
import type { Match, Tournament } from "@features/tournament/lib/types";

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

const MONITOR = COPY.monitor;

const STATUS_ORDER: readonly (keyof StatusCounts)[] = ["pending", "ready", "active", "frozen", "finished"];

export function TournamentDashboard({ initial, viewer, action, load }: Readonly<TournamentDashboardProps>) {
  const { tournament, hasConnectionError, refresh } = useTournament(initial, load);

  return (
    <div className="grid gap-8">
      <ConnectionToast isLost={hasConnectionError} />
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
  // The sysadmin watches every area, like the administrator, but captures nothing and has no log (S37).
  const sections = getSections(tournament, { isAdmin: viewer.role !== "kof_staff", desk: viewer.desk });

  if (viewer.role === "kof_staff" && viewer.desk === null) return <p className="type-mono text-muted">{COPY.noDesk}</p>;

  return (
    <>
      {tournament.phase === "finished" && <ChampionBanner tag={getChampionTag(tournament)} />}
      <LiveMonitor tournament={tournament} matches={sections.flatMap((section) => section.matches)} />
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

// S11: what is happening right now in the areas this account sees, kept fresh by the same 3-second poll.
function LiveMonitor({ tournament, matches }: Readonly<{ tournament: Tournament; matches: readonly Match[] }>) {
  const counts = getStatusCounts(matches);

  return (
    <section aria-labelledby="kof-live-heading" className="grid gap-4 border border-border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="kof-live-heading" className="type-section">
          {MONITOR.heading}
        </h2>
        <p className="type-tiny text-muted">{MONITOR.refresh(POLL_INTERVAL_MS / 1000)}</p>
      </div>
      <p className="font-bold tabular-nums">{MONITOR.progress(counts.finished, matches.length)}</p>
      <StatusSummary counts={counts} />
      <LiveMatchList tournament={tournament} matches={getLiveMatches(matches)} />
    </section>
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

function LiveMatchList({ tournament, matches }: Readonly<{ tournament: Tournament; matches: readonly Match[] }>) {
  if (matches.length === 0) return <p className="text-sm text-muted">{MONITOR.empty}</p>;

  return (
    <ul aria-label={MONITOR.liveLabel} className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
      {matches.map((match) => (
        <LiveMatchRow key={match.id} tournament={tournament} match={match} />
      ))}
    </ul>
  );
}

function LiveMatchRow({ tournament, match }: Readonly<{ tournament: Tournament; match: Match }>) {
  const [first, second] = getMatchPlayers(tournament, match);
  const isFrozen = match.status === "frozen";

  return (
    <li className="grid gap-1 border border-border p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-mono font-bold">{COPY.match.heading(match.number)}</span>
        <span className={isFrozen ? "type-tiny text-danger" : "type-tiny text-accent"}>
          {TOURNAMENT_COPY.status[match.status]}
        </span>
      </div>
      <span className="font-bold">{MONITOR.versus(first.tag, second.tag)}</span>
      <span className="type-tiny text-muted">
        {MONITOR.where(TOURNAMENT_COPY.areas[match.area], getMatchDesk(match))}
      </span>
    </li>
  );
}
