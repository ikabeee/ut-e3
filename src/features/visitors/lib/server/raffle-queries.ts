import "server-only";
import { randomInt } from "node:crypto";
import { connection } from "next/server";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import type { RaffleTicket, RaffleWinner } from "@features/visitors/lib/types";
import { pickRandom } from "@features/visitors/lib/visitor-rules";
import type { findVisitorByToken, listRequiredGames } from "@features/visitors/lib/server/visitors-queries";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";

// Boletos del sorteo. Las reglas viven aquí, en el servidor: el boleto sólo se entrega a
// quien probó todos los juegos con stand, y el sorteo elige entre los boletos que existen.

const NOT_A_WINNER = "Ese boleto no existe o no ha ganado.";

const INVALID_PASSPORT =
  "Tu pasaporte ya no es válido. Abre la captura de tu QR o pide ayuda en el módulo de información.";

const getDb = async () => (await import("@shared/lib/prisma/db")).db;

async function ticketOf(visitorId: string) {
  const db = await getDb();

  return db.orm.public.RaffleTicket.select("ticketNumber", "wonAt").where({ visitorId });
}

export interface ClaimRaffleTicketDependencies {
  findVisitor?: typeof findVisitorByToken;
  fetchRequiredGames?: typeof listRequiredGames;
  findExistingTicket?: (visitorId: string) => Promise<RaffleTicket | null>;
  fetchCheckedGameIds?: (visitorId: string) => Promise<string[]>;
  createTicket?: (visitorId: string, phone: string) => Promise<RaffleTicket | null>;
  sendTicketEmail?: (email: string, fullName: string, ticketNumber: number) => Promise<boolean>;
}

const defaultFindVisitor: typeof findVisitorByToken = async (token) =>
  (await import("@features/visitors/lib/server/visitors-queries")).findVisitorByToken(token);

const defaultListRequiredGames: typeof listRequiredGames = async () =>
  (await import("@features/visitors/lib/server/visitors-queries")).listRequiredGames();

const defaultFindExistingTicket = async (visitorId: string) => (await ticketOf(visitorId)).first();

const defaultFetchCheckedGameIds = async (visitorId: string) => {
  const db = await getDb();

  const checkedGames = await db.orm.public.CheckIn.select("gameId").where({ visitorId }).all();

  return checkedGames.map((checkIn) => checkIn.gameId);
};

const defaultCreateTicket = async (visitorId: string, phone: string) => {
  const db = await getDb();

  const [created] = await db.orm.public.RaffleTicket.select("ticketNumber", "wonAt").createAll([{ visitorId, phone }], {
    onConflict: "skip",
    conflictOn: ["visitorId"],
  });

  return created ?? (await (await ticketOf(visitorId)).first());
};

const defaultSendTicketEmail = async (email: string, fullName: string, ticketNumber: number) => {
  const { sendVisitorRaffleTicketEmail } = await import("@features/visitors/lib/server/visitor-email-service");

  return sendVisitorRaffleTicketEmail(email, fullName, ticketNumber);
};

/**
 * Entrega el boleto al visitante dueño del token. Se puede reintentar: si ya tenía boleto,
 * devuelve el mismo (sin cambiar el teléfono). Un teléfono que ya tiene boleto viola
 * `raffle_ticket_phone_key` y la acción lo traduce a un mensaje claro.
 */
export async function claimRaffleTicket(
  token: string,
  phone: string,
  deps: ClaimRaffleTicketDependencies = {},
): Promise<RaffleTicket> {
  const findVisitor = deps.findVisitor ?? defaultFindVisitor;
  const visitor = await findVisitor(token);

  if (!visitor) throw new RecordNotFoundError(INVALID_PASSPORT);

  const findTicket = deps.findExistingTicket ?? defaultFindExistingTicket;
  const existing = await findTicket(visitor.id);

  if (existing) return existing;

  const fetchRequired = deps.fetchRequiredGames ?? defaultListRequiredGames;
  const requiredGames = await fetchRequired();

  // Sin stands asignados no hay juegos que probar: el sorteo todavía no abre.
  if (requiredGames.length === 0) throw new ActionRuleError(VISITORS_COPY.raffle.noStands);

  const fetchChecked = deps.fetchCheckedGameIds ?? defaultFetchCheckedGameIds;
  const checkedGameIds = await fetchChecked(visitor.id);
  const checkedIds = new Set(checkedGameIds);
  const missing = requiredGames.filter((game) => !checkedIds.has(game.id)).length;

  if (missing > 0) throw new ActionRuleError(VISITORS_COPY.raffle.notYet(missing));

  const create = deps.createTicket ?? defaultCreateTicket;
  const ticket = await create(visitor.id, phone);

  if (!ticket) throw new RecordNotFoundError(INVALID_PASSPORT);

  const sendTicketEmail = deps.sendTicketEmail ?? defaultSendTicketEmail;

  if (visitor.email) {
    try {
      await sendTicketEmail(visitor.email, visitor.fullName || visitor.gamertag, ticket.ticketNumber);
    } catch (error) {
      console.error("No se pudo enviar el correo del boleto del sorteo:", error);
    }
  }

  return ticket;
}

async function winnersWhere(ticketNumbers?: readonly number[]) {
  const db = await getDb();

  const winners = db.orm.public.RaffleTicket.select("ticketNumber", "phone", "wonAt", "notifiedAt")
    .where((ticket) => ticket.wonAt.isNotNull())
    .include("visitor", (visitor) => visitor.select("gamertag"));

  return ticketNumbers ? winners.where((ticket) => ticket.ticketNumber.in([...ticketNumbers])) : winners;
}

interface WinnerRow {
  readonly ticketNumber: number;
  readonly phone: string | null;
  readonly wonAt: string | null;
  readonly notifiedAt: string | null;
  readonly visitor?: { readonly gamertag: string } | null;
}

function toWinner(row: WinnerRow): RaffleWinner {
  return {
    ticketNumber: row.ticketNumber,
    gamertag: row.visitor?.gamertag ?? "",
    phone: row.phone ?? "",
    wonAt: row.wonAt ?? "",
    notifiedAt: row.notifiedAt,
  };
}

/** Ganadores en el orden en que salieron (panel de administración). */
export async function listRaffleWinners(): Promise<RaffleWinner[]> {
  await connection();

  const query = await winnersWhere();

  const rows = await query.orderBy([(ticket) => ticket.wonAt.asc(), (ticket) => ticket.ticketNumber.asc()]).all();

  return rows.map(toWinner);
}

/**
 * Sortea `count` ganadores entre los boletos que todavía no han ganado (nunca un número al
 * azar entre 1 y el máximo: los números pueden tener huecos). Usa `crypto.randomInt`.
 */
export async function drawRaffleWinners(count: number): Promise<RaffleWinner[]> {
  const db = await getDb();

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

  const query = await winnersWhere(updated.map((ticket) => ticket.ticketNumber));

  const rows = await query.orderBy((ticket) => ticket.ticketNumber.asc()).all();

  return rows.map(toWinner);
}

/** Marca que ya se le avisó al ganador (mensaje para presentarse en el main stage). */
export async function markRaffleWinnerNotified(ticketNumber: number): Promise<RaffleWinner> {
  if (!Number.isSafeInteger(ticketNumber)) throw new RecordNotFoundError(NOT_A_WINNER);

  const db = await getDb();

  const updated = await db.orm.public.RaffleTicket.where({ ticketNumber })
    .where((ticket) => ticket.wonAt.isNotNull())
    .update({ notifiedAt: new Date().toISOString() });

  if (!updated) throw new RecordNotFoundError(NOT_A_WINNER);

  const query = await winnersWhere([ticketNumber]);

  const [winner] = await query.all();

  if (!winner) throw new RecordNotFoundError(NOT_A_WINNER);

  return toWinner(winner);
}
