"use server";

import { requireKofAccount } from "@features/accounts/lib/server/current-account";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { parseTournamentCommand } from "@features/tournament/lib/tournament-command-parser";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import { canRunCommand } from "@features/tournament/lib/tournament-rules";
import type { TournamentCommand } from "@features/tournament/lib/types";
import { runTournamentCommand, type CommandResult } from "@features/tournament/lib/server/tournament-mutations";
import { getTournament } from "@features/tournament/lib/server/tournament-queries";

export type TournamentActionState = { status: "applied" } | { status: "error"; message: string };

const ERRORS = TOURNAMENT_COPY.errors;

// Server Actions are public endpoints: the session, the role and the desk of the match are checked here (RF-62).
export async function submitTournamentCommand(
  _previous: TournamentActionState | null,
  form: FormData,
): Promise<TournamentActionState> {
  const actor = await requireKofAccount();
  const parsed = parseTournamentCommand(form);

  if (!parsed.isValid) return failure(ERRORS.invalidCommand);

  const tournament = await getTournament();

  if (!tournament) return failure(ERRORS.notGenerated);

  const match = tournament.matches.find((item) => item.id === parsed.command.matchId);

  if (!match) return failure(ERRORS.matchNotFound);

  if (!canRunCommand({ role: actor.role, desk: actor.kofDesk }, parsed.command.type, match)) {
    return failure(ERRORS.forbidden);
  }

  return execute(actor.id, parsed.command);
}

async function execute(actorId: string, command: TournamentCommand): Promise<TournamentActionState> {
  try {
    return toState(await runTournamentCommand(actorId, command, new Date()));
  } catch (cause) {
    if (cause instanceof TournamentRuleError) return failure(cause.message);

    throw cause;
  }
}

function toState(result: CommandResult): TournamentActionState {
  if (result.status === "applied") return { status: "applied" };

  return failure(result.status === "notGenerated" ? ERRORS.notGenerated : ERRORS.conflict);
}

function failure(message: string): TournamentActionState {
  return { status: "error", message };
}
