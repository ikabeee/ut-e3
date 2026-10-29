import { createContext, useContext, useRef } from "react";
import { useBracketCamera } from "@features/tournament/hooks/use-bracket-camera";
import type { CurrentPlayback } from "@features/tournament/hooks/use-bracket-playback";
import type { PublicBracket, PublicMatch, PublicPlayer } from "@features/tournament/lib/public-bracket";
import { buildBracketTree, type TreeColumn } from "@features/tournament/lib/public-bracket-tree";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";

type Side = "left" | "right";

type PairRole = "top" | "bottom" | "single";

interface TreeCellProps {
  match: PublicMatch;
  side: Side;
  pairRole: PairRole;
  hasPrevious: boolean;
}

const COPY = TOURNAMENT_COPY.ui.publicBracket.tree;

// What the show is playing, for the match boxes to read without passing it through every column.
const PlaybackContext = createContext<CurrentPlayback | null>(null);

// Height of one first round match, with its two players; every later round doubles it by splitting the column evenly.
const CELL_HEIGHT_PX = 56;

const HEADER_HEIGHT_PX = 28;

// `side` is where the half sits: the lines of the left half go to the right, towards the final, and the right half mirrors it.
const LINES = {
  left: {
    out: "absolute top-1/2 right-0 w-4 border-t border-foreground/40",
    in: "absolute top-1/2 left-0 w-4 border-t border-foreground/40",
    joinTop: "absolute top-1/2 right-0 h-1/2 border-r border-foreground/40",
    joinBottom: "absolute top-0 right-0 h-1/2 border-r border-foreground/40",
  },
  right: {
    out: "absolute top-1/2 left-0 w-4 border-t border-foreground/40",
    in: "absolute top-1/2 right-0 w-4 border-t border-foreground/40",
    joinTop: "absolute top-1/2 left-0 h-1/2 border-l border-foreground/40",
    joinBottom: "absolute top-0 left-0 h-1/2 border-l border-foreground/40",
  },
} as const;

/** The bracket drawn as a tree with brackets: two mirrored halves that meet in the final, like a tournament poster. */
export function BracketTree({
  bracket,
  playback = null,
}: Readonly<{ bracket: PublicBracket; playback?: CurrentPlayback | null }>) {
  const tree = buildBracketTree(bracket);
  const stageRef = useRef<HTMLDivElement>(null);
  useBracketCamera(stageRef, playback);
  const height = tree.left[0].matches.length * CELL_HEIGHT_PX + HEADER_HEIGHT_PX;

  return (
    <PlaybackContext value={playback}>
      <div
        ref={stageRef}
        role="group"
        aria-label={COPY.label}
        className="relative flex items-stretch"
        style={{ height }}
      >
        <Half columns={tree.left} side="left" />
        <FinalColumn match={tree.final} label={tree.finalLabel} />
        <Half columns={tree.right} side="right" />
      </div>
    </PlaybackContext>
  );
}

// The columns arrive from the outside in; the right half is shown from the inside out, so it mirrors the left one.
function Half({ columns, side }: Readonly<{ columns: readonly TreeColumn[]; side: Side }>) {
  const shown = columns.map((column, depth) => ({ column, depth }));

  return (
    <div className="flex flex-5 items-stretch">
      {(side === "right" ? shown.toReversed() : shown).map(({ column, depth }) => (
        <RoundColumn key={column.label} column={column} side={side} hasPrevious={depth > 0} />
      ))}
    </div>
  );
}

function RoundColumn({
  column,
  side,
  hasPrevious,
}: Readonly<{ column: TreeColumn; side: Side; hasPrevious: boolean }>) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="flex items-center justify-center type-tiny text-muted" style={{ height: HEADER_HEIGHT_PX }}>
        {column.label}
      </p>
      <div className="flex flex-1 flex-col">
        {column.matches.map((match, index) => (
          <TreeCell
            key={match.number}
            match={match}
            side={side}
            pairRole={getPairRole(column.matches.length, index)}
            hasPrevious={hasPrevious}
          />
        ))}
      </div>
    </div>
  );
}

function getPairRole(columnSize: number, index: number): PairRole {
  if (columnSize === 1) return "single";

  return index % 2 === 0 ? "top" : "bottom";
}

function TreeCell({ match, side, pairRole, hasPrevious }: Readonly<TreeCellProps>) {
  const lines = LINES[side];

  return (
    <div className={`relative flex flex-1 items-center ${getPadding(side, hasPrevious)}`}>
      <MatchBox match={match} />
      <span data-connector aria-hidden="true" className={lines.out} />
      {pairRole === "top" && <span data-connector aria-hidden="true" className={lines.joinTop} />}
      {pairRole === "bottom" && <span data-connector aria-hidden="true" className={lines.joinBottom} />}
      {hasPrevious && <span data-connector aria-hidden="true" className={lines.in} />}
    </div>
  );
}

// Room for the lines on both sides of the box: always towards the final, and from the previous round when there is one.
function getPadding(side: Side, hasPrevious: boolean): string {
  if (side === "left") return hasPrevious ? "pr-4 pl-4" : "pr-4";

  return hasPrevious ? "pl-4 pr-4" : "pl-4";
}

function FinalColumn({ match, label }: Readonly<{ match: PublicMatch; label: string }>) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="flex items-center justify-center type-tiny text-muted" style={{ height: HEADER_HEIGHT_PX }}>
        {label}
      </p>
      <div className="relative flex flex-1 items-center px-4">
        <MatchBox match={match} />
        <span data-connector aria-hidden="true" className={LINES.left.in} />
        <span data-connector aria-hidden="true" className={LINES.right.in} />
      </div>
    </div>
  );
}

function MatchBox({ match }: Readonly<{ match: PublicMatch }>) {
  const [first, second] = match.players;
  const playback = useContext(PlaybackContext);
  const step = getMatchStep(match.number, playback);

  return (
    <div
      role="group"
      data-number={match.number}
      aria-label={COPY.matchLabel(match.number, first.tag, second.tag)}
      data-status={match.status}
      data-playback={step}
      className={`grid w-full divide-y divide-border border bg-surface ${getBoxTone(match, step)}`}
    >
      {match.players.map((player, index) => (
        <PlayerRow
          key={index}
          player={player}
          isFinished={match.status === "finished"}
          isArriving={isArriving(match.number, index, playback)}
        />
      ))}
    </div>
  );
}

// "approach" and "decide" belong to the match being played; the next round only shows where the winner lands.
function getMatchStep(number: number, playback: CurrentPlayback | null): "approach" | "decide" | undefined {
  if (!playback || playback.number !== number) return undefined;

  return playback.phase === "approach" || playback.phase === "decide" ? playback.phase : undefined;
}

function isArriving(number: number, slot: number, playback: CurrentPlayback | null): boolean {
  return playback?.phase === "advance" && playback.advance?.number === number && playback.advance.slot === slot;
}

function getBoxTone(match: PublicMatch, step: "approach" | "decide" | undefined): string {
  if (step === "approach") return "relative z-10 animate-approach border-accent";

  if (step === "decide") return "relative z-10 animate-win-glow border-accent";

  return match.status === "active" ? "border-accent" : "border-border";
}

interface PlayerRowProps {
  player: PublicPlayer;
  isFinished: boolean;
  isArriving: boolean;
}

function PlayerRow({ player, isFinished, isArriving }: Readonly<PlayerRowProps>) {
  const result = getResult(player, isFinished);

  return (
    <div
      className={`flex min-h-6 items-center px-2 text-xs ${getRowTone(player, isFinished)} ${isArriving ? "animate-arrive" : ""}`}
      title={player.tag}
      data-result={result}
      data-playback={isArriving ? "arrive" : undefined}
    >
      <span className="truncate">{player.tag}</span>
      {player.isWinner && <span className="sr-only">{COPY.won}</span>}
    </div>
  );
}

function getResult(player: PublicPlayer, isFinished: boolean): "winner" | "loser" | undefined {
  if (player.isWinner) return "winner";

  return isFinished && !player.isBye && player.tag !== TOURNAMENT_COPY.tbd ? "loser" : undefined;
}

// The winner stands out; the loser is struck through in red, and a bye or a place still open fades.
function getRowTone(player: PublicPlayer, isFinished: boolean): string {
  const result = getResult(player, isFinished);

  if (result === "winner") return "font-bold text-accent";

  if (result === "loser") return "text-danger line-through";

  return player.isBye || player.tag === TOURNAMENT_COPY.tbd ? "text-muted" : "text-foreground";
}
