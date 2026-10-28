import "server-only";
import { randomInt } from "node:crypto";
import { generateBracket } from "@features/tournament/lib/bracket-generation";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { applyCommand } from "@features/tournament/lib/tournament-engine";
import { TournamentRuleError } from "@features/tournament/lib/tournament-rule-error";
import { MAX_ENTRANTS } from "@features/tournament/lib/tournament-rules";
import type { Player, Tournament, TournamentCommand } from "@features/tournament/lib/types";
import {
  getBracketGeneratesAt,
  getTournament,
  TOURNAMENT_ROW_ID,
} from "@features/tournament/lib/server/tournament-queries";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit, type AuditEntry } from "@shared/lib/server/audit-log";
import { isUniqueViolation } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

const ENTITY_TYPE = "kof_tournament";

const MAX_SAVE_ATTEMPTS = 3;

export type GenerateResult =
  | { status: "created"; tournament: Tournament }
  | { status: "tooEarly"; generatesAt: Date }
  | { status: "alreadyGenerated" };

export type CommandResult =
  { status: "applied"; tournament: Tournament } | { status: "notGenerated" } | { status: "conflict" };

export type TournamentAudit = Pick<AuditEntry, "actorId" | "action" | "detail">;

/**
 * Generates the bracket once, from the configured hour (RF-59). The shuffle with `crypto.randomInt` and its result go
 * to the audit log in the same transaction that stores the tournament.
 */
export async function generateTournament(
  actorId: string,
  entrants: readonly Player[],
  now: Date,
): Promise<GenerateResult> {
  const generatesAt = await getBracketGeneratesAt();

  if (!generatesAt) throw new Error(TOURNAMENT_COPY.errors.missingSettings);

  if (now < generatesAt) return { status: "tooEarly", generatesAt };

  const tournament = generateBracket(entrants, (maxExclusive) => randomInt(maxExclusive), now.getTime());

  return (await insertTournament(actorId, tournament))
    ? { status: "created", tournament }
    : { status: "alreadyGenerated" };
}

/**
 * Applies one command to the stored tournament. If the other desk saved first, the command is applied again on the
 * fresh state; it only fails when it no longer fits (UT-TO-16).
 */
export async function runTournamentCommand(
  actorId: string,
  command: TournamentCommand,
  now: Date,
): Promise<CommandResult> {
  for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt += 1) {
    const current = await getTournament();

    if (!current) return { status: "notGenerated" };

    const next = attempt === 0 ? applyCommand(current, command, now.getTime()) : applyAgain(current, command, now);
    const audit = { actorId, action: "kof_tournament.command", detail: { command, version: next.version } };

    if (await saveTournament(current, next, audit)) return { status: "applied", tournament: next };
  }

  return { status: "conflict" };
}

/** Stores `next` only if the row still has the version of `previous`; `false` means someone else saved first. */
export async function saveTournament(previous: Tournament, next: Tournament, audit: TournamentAudit): Promise<boolean> {
  return getPrisma().$transaction(async (transaction) => {
    const { count } = await transaction.kofTournament.updateMany({
      where: { id: TOURNAMENT_ROW_ID, version: previous.version },
      data: { state: toJson(next), version: next.version },
    });

    if (count === 0) return false;

    await recordAudit(transaction, { ...audit, entityType: ENTITY_TYPE, entityId: String(TOURNAMENT_ROW_ID) });

    return true;
  });
}

async function insertTournament(actorId: string, tournament: Tournament): Promise<boolean> {
  try {
    await getPrisma().$transaction(async (transaction) => {
      await transaction.kofTournament.create({
        data: { id: TOURNAMENT_ROW_ID, state: toJson(tournament), version: tournament.version },
      });
      await recordAudit(transaction, {
        actorId,
        action: "kof_tournament.generate",
        entityType: ENTITY_TYPE,
        entityId: String(TOURNAMENT_ROW_ID),
        detail: {
          players: tournament.players.map((player) => player.id),
          byes: MAX_ENTRANTS - tournament.players.length,
        },
      });
    });

    return true;
  } catch (cause) {
    if (isUniqueViolation(cause)) return false;

    throw cause;
  }
}

function applyAgain(current: Tournament, command: TournamentCommand, now: Date): Tournament {
  try {
    return applyCommand(current, command, now.getTime());
  } catch (cause) {
    if (cause instanceof TournamentRuleError) throw new TournamentRuleError(TOURNAMENT_COPY.errors.matchChanged);

    throw cause;
  }
}

function toJson(tournament: Tournament): Prisma.InputJsonObject {
  // SAFETY: `Tournament` only holds plain JSON, so the round trip keeps its shape and drops the interface typing.
  return JSON.parse(JSON.stringify(tournament)) as Prisma.InputJsonObject;
}
