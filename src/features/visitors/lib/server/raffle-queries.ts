import "server-only";
import { randomInt } from "node:crypto";
import { connection } from "next/server";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import type { RaffleTicket, RaffleWinner } from "@features/visitors/lib/types";
import { pickRandom } from "@features/visitors/lib/visitor-rules";
import { findVisitorByToken, listRequiredGames } from "@features/visitors/lib/server/visitors-queries";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { db } from "@shared/lib/prisma/db";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";

// Boletos del sorteo. Las reglas viven aquí, en el servidor: el boleto sólo se entrega a
// quien probó todos los juegos con stand, y el sorteo elige entre los boletos que existen.

const NOT_A_WINNER = "Ese boleto no existe o no ha ganado.";

const INVALID_PASSPORT =
  "Tu pasaporte ya no es válido. Abre la captura de tu QR o pide ayuda en el módulo de información.";

function ticketOf(visitorId: string) {
  return db.orm.public.RaffleTicket.select("ticketNumber", "wonAt").where({ visitorId });
}

/**
 * Entrega el boleto al visitante dueño del token. Se puede reintentar: si ya tenía boleto,
 * devuelve el mismo (sin cambiar el teléfono). Un teléfono que ya tiene boleto viola
 * `raffle_ticket_phone_key` y la acción lo traduce a un mensaje claro.
 */
export async function claimRaffleTicket(token: string, phone: string): Promise<RaffleTicket> {
  const visitor = await findVisitorByToken(token);

  if (!visitor) throw new RecordNotFoundError(INVALID_PASSPORT);

  const existing = await ticketOf(visitor.id).first();

  if (existing) return existing;

  const requiredGames = await listRequiredGames();
  const checkedGames = await db.orm.public.CheckIn.select("gameId").where({ visitorId: visitor.id }).all();
  const checkedIds = new Set(checkedGames.map((checkIn) => checkIn.gameId));
  const missing = requiredGames.filter((game) => !checkedIds.has(game.id)).length;

  if (requiredGames.length === 0 || missing > 0) {
    throw new ActionRuleError(VISITORS_COPY.raffle.notYet(missing));
  }

  // Si dos peticiones llegan a la vez, la segunda no inserta nada y lee el boleto de la primera.
  const [created] = await db.orm.public.RaffleTicket.select("ticketNumber", "wonAt").createAll(
    [{ visitorId: visitor.id, phone }],
    {
      onConflict: "skip",
      conflictOn: ["visitorId"],
    },
  );

  const ticket = created ?? (await ticketOf(visitor.id).first());

  if (!ticket) throw new RecordNotFoundError(INVALID_PASSPORT);

  return ticket;
}

function winnersWhere(ticketNumbers?: readonly number[]) {
  const winners = db.orm.public.RaffleTicket.select("ticketNumber", "phone", "wonAt", "notifiedAt")
    .where((ticket) => ticket.wonAt.isNotNull())
    .include("visitor", (visitor) => visitor.select("gamertag"));

  return ticketNumbers ? winners.where((ticket) => ticket.ticketNumber.in([...ticketNumbers])) : winners;
}

type WinnerRow = Awaited<ReturnType<ReturnType<typeof winnersWhere>["first"]>>;

function toWinner(row: NonNullable<WinnerRow>): RaffleWinner {
  return {
    ticketNumber: row.ticketNumber,
    gamertag: row.visitor?.gamertag ?? "",
    phone: row.phone,
    wonAt: row.wonAt ?? "",
    notifiedAt: row.notifiedAt,
  };
}

/** Ganadores en el orden en que salieron (panel de administración). */
export async function listRaffleWinners(): Promise<RaffleWinner[]> {
  await connection();

  const rows = await winnersWhere()
    .orderBy([(ticket) => ticket.wonAt.asc(), (ticket) => ticket.ticketNumber.asc()])
    .all();

  return rows.map(toWinner);
}

/**
 * Sortea `count` ganadores entre los boletos que todavía no han ganado (nunca un número al
 * azar entre 1 y el máximo: los números pueden tener huecos). Usa `crypto.randomInt`.
 */
export async function drawRaffleWinners(count: number): Promise<RaffleWinner[]> {
  const candidates = await db.orm.public.RaffleTicket.select("ticketNumber")
    .where((ticket) => ticket.wonAt.isNull())
    .all();

  if (candidates.length === 0) throw new ActionRuleError("No quedan boletos sin premio para sortear.");

  const picked = pickRandom(
    candidates.map((ticket) => ticket.ticketNumber),
    count,
    (max) => randomInt(max),
  );

  // `wonAt IS NULL` otra vez: si dos sorteos corren a la vez, un boleto no gana dos veces.
  const updated = await db.orm.public.RaffleTicket.where((ticket) => ticket.ticketNumber.in(picked))
    .where((ticket) => ticket.wonAt.isNull())
    .updateAll({ wonAt: new Date().toISOString() });

  const rows = await winnersWhere(updated.map((ticket) => ticket.ticketNumber))
    .orderBy((ticket) => ticket.ticketNumber.asc())
    .all();

  return rows.map(toWinner);
}

/** Marca que ya se le avisó al ganador (mensaje para presentarse en el main stage). */
export async function markRaffleWinnerNotified(ticketNumber: number): Promise<RaffleWinner> {
  if (!Number.isSafeInteger(ticketNumber)) throw new RecordNotFoundError(NOT_A_WINNER);

  const updated = await db.orm.public.RaffleTicket.where({ ticketNumber })
    .where((ticket) => ticket.wonAt.isNotNull())
    .update({ notifiedAt: new Date().toISOString() });

  if (!updated) throw new RecordNotFoundError(NOT_A_WINNER);
  const [winner] = await winnersWhere([ticketNumber]).all();

  if (!winner) throw new RecordNotFoundError(NOT_A_WINNER);

  return toWinner(winner);
}
