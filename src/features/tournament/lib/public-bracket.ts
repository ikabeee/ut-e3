import { getChampionTag, getMatchPlayers, type PlayerView } from "@features/tournament/lib/tournament-view";
import type {
  Match,
  MatchArea,
  MatchOutcome,
  MatchStatus,
  Tournament,
  TournamentPhase,
} from "@features/tournament/lib/types";

export interface PublicPlayer {
  tag: string;
  isBye: boolean;
  isWinner: boolean;
}

export interface PublicMatch {
  number: number;
  area: MatchArea;
  round: number;
  status: MatchStatus;
  outcome: MatchOutcome | null;
  players: [PublicPlayer, PublicPlayer];
}

/** What any visitor may see: gamertags and results. No ids, no emails, no PINs and no audit log (RF-67). */
export interface PublicBracket {
  version: number;
  phase: TournamentPhase;
  championTag: string | null;
  matches: PublicMatch[];
}

/** `closed` hides the bracket (RF-74) and `pending` means it was not generated yet. */
export type PublicSnapshot =
  { state: "open"; bracket: PublicBracket; serverNow: number } | { state: "closed" | "pending"; serverNow: number };

export function toPublicBracket(tournament: Tournament): PublicBracket {
  return {
    version: tournament.version,
    phase: tournament.phase,
    championTag: getChampionTag(tournament),
    matches: tournament.matches.map((match) => toPublicMatch(tournament, match)),
  };
}

function toPublicMatch(tournament: Tournament, match: Match): PublicMatch {
  const [first, second] = getMatchPlayers(tournament, match);

  return {
    number: match.number,
    area: match.area,
    round: match.round,
    status: match.status,
    outcome: match.outcome,
    players: [toPublicPlayer(first), toPublicPlayer(second)],
  };
}

function toPublicPlayer(player: PlayerView): PublicPlayer {
  return { tag: player.tag, isBye: player.isBye, isWinner: player.isWinner };
}

/** Checks what the public endpoint answered before the page trusts it; the endpoint is the only sender. */
export function isPublicSnapshot(value: unknown): value is PublicSnapshot {
  if (typeof value !== "object" || value === null) return false;

  if (!("serverNow" in value) || typeof value.serverNow !== "number" || !("state" in value)) return false;

  if (value.state === "closed" || value.state === "pending") return true;

  return value.state === "open" && "bracket" in value && isPublicBracket(value.bracket);
}

function isPublicBracket(value: unknown): value is PublicBracket {
  return (
    typeof value === "object" &&
    value !== null &&
    "matches" in value &&
    Array.isArray(value.matches) &&
    "version" in value &&
    typeof value.version === "number"
  );
}
