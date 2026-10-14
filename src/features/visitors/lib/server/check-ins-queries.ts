import "server-only";
import { EVENT_INFO } from "@features/event/lib/event-info";
import type { CheckInItem, CheckInResult, CheckInStatus } from "@features/visitors/lib/types";
import { clampScannedAt, extractVisitorToken } from "@features/visitors/lib/visitor-rules";
import { hashSecret } from "@shared/lib/server/secrets";

const getDb = async () => (await import("@shared/lib/prisma/db")).db;

// Check-ins que envía el escáner de cada stand (POST /api/check-ins). El juego sale de la
// llave del escáner, nunca de lo que manda el cliente, y guardar el lote es idempotente: el
// escáner puede reenviar sus escaneos cuantas veces quiera.

const SCANNER_KEY_PATTERN = /^[0-9a-f]{32}$/;

export interface ScannerGame {
  gameId: string;
  gameName: string;
  standCode: string | null;
}

/** Juego del equipo dueño de la llave del escáner; `null` si la llave no existe. */
export async function findScannerGame(scannerKey: string): Promise<ScannerGame | null> {
  if (!SCANNER_KEY_PATTERN.test(scannerKey)) return null;

  const db = await getDb();

  const team = await db.orm.public.Team.select("standCode")
    .where({ scannerKeyHash: hashSecret(scannerKey) })
    .include("game", (game) => game.select("id", "name"))
    .first();

  return team?.game ? { gameId: team.game.id, gameName: team.game.name, standCode: team.standCode } : null;
}

function getStatus(id: string, insertedIds: ReadonlySet<string>, knownIds: ReadonlySet<string>): CheckInStatus {
  if (insertedIds.has(id)) return "created";

  return knownIds.has(id) ? "duplicate" : "unknown";
}

export interface CheckInRow {
  id: string;
  visitorId: string;
  gameId: string;
  scannedAt: string;
}

export interface RecordCheckInsDependencies {
  findVisitorIds?: (tokenHashes: string[]) => Promise<Map<string, string>>;
  insertRows?: (rows: CheckInRow[]) => Promise<Set<string>>;
  awardRaffleTickets?: (visitorIds: readonly string[]) => Promise<void>;
}

/** Hash del token de cada escaneo, por id del escaneo. Lo que no es un QR de visitante se omite. */
function hashScannedTokens(items: readonly CheckInItem[]) {
  const tokenHashById = new Map<string, string>();

  for (const item of items) {
    const token = extractVisitorToken(item.token);

    if (token) tokenHashById.set(item.id, hashSecret(token));
  }

  return tokenHashById;
}

/** Id de cada visitante por el hash de su token, con una sola consulta para todo el lote. */
async function findVisitorIdsByTokenHash(tokenHashes: string[]) {
  if (tokenHashes.length === 0) return new Map<string, string>();

  const db = await getDb();

  const visitors = await db.orm.public.Visitor.select("id", "qrTokenHash")
    .where((visitor) => visitor.qrTokenHash.in(tokenHashes))
    .all();

  return new Map(visitors.map((visitor) => [visitor.qrTokenHash, visitor.id]));
}

/** Guarda las filas y devuelve los ids que sí se insertaron (los repetidos se omiten). */
async function insertCheckIns(rows: CheckInRow[]) {
  if (rows.length === 0) return new Set<string>();

  const db = await getDb();
  const inserted = await db.orm.public.CheckIn.select("id").createAll(rows, { onConflict: "skip" });

  return new Set(inserted.map((row) => row.id));
}

async function awardRaffleTicketForVisitor(
  db: Awaited<ReturnType<typeof getDb>>,
  visitorId: string,
  requiredIds: Set<string>,
  sendEmail: (email: string, name: string, ticketNumber: number) => Promise<boolean>,
): Promise<void> {
  const existingTicket = await db.orm.public.RaffleTicket.select("ticketNumber").where({ visitorId }).first();

  if (existingTicket) return;

  const checkIns = await db.orm.public.CheckIn.select("gameId").where({ visitorId }).all();
  const checkedIds = new Set(checkIns.map((c) => c.gameId));

  const completedAll = [...requiredIds].every((id) => checkedIds.has(id));

  if (!completedAll) return;

  const [ticket] = await db.orm.public.RaffleTicket.select("ticketNumber").createAll([{ visitorId }], {
    onConflict: "skip",
    conflictOn: ["visitorId"],
  });

  if (!ticket) return;

  const visitor = await db.orm.public.Visitor.select("email", "fullName", "gamertag").where({ id: visitorId }).first();

  if (visitor?.email) {
    try {
      await sendEmail(visitor.email, visitor.fullName || visitor.gamertag, ticket.ticketNumber);
    } catch (error) {
      console.error("No se pudo enviar el correo del boleto del sorteo:", error);
    }
  }
}

async function checkAndAwardCompletedRaffleTickets(visitorIds: readonly string[]): Promise<void> {
  if (visitorIds.length === 0) return;

  const db = await getDb();
  const { listRequiredGames } = await import("@features/visitors/lib/server/visitors-queries");
  const requiredGames = await listRequiredGames();

  if (requiredGames.length === 0) return;

  const requiredIds = new Set(requiredGames.map((g) => g.id));
  const { sendVisitorRaffleTicketEmail } = await import("@features/visitors/lib/server/visitor-email-service");

  for (const visitorId of visitorIds) {
    await awardRaffleTicketForVisitor(db, visitorId, requiredIds, sendVisitorRaffleTicketEmail);
  }
}

/**
 * Guarda un lote de escaneos del juego. Los QR desconocidos se descartan sin abortar el lote
 * y `ON CONFLICT DO NOTHING` (sin columna) ignora tanto un reenvío (mismo id) como un segundo
 * escaneo del mismo visitante en el mismo stand.
 */
export async function recordCheckIns(
  gameId: string,
  items: readonly CheckInItem[],
  now = new Date(),
  deps: RecordCheckInsDependencies = {},
): Promise<CheckInResult[]> {
  const findVisitorIds = deps.findVisitorIds ?? findVisitorIdsByTokenHash;
  const insert = deps.insertRows ?? insertCheckIns;

  const tokenHashById = hashScannedTokens(items);
  const tokenHashes = [...new Set(tokenHashById.values())];

  const visitorIdByHash = tokenHashes.length > 0 ? await findVisitorIds(tokenHashes) : new Map<string, string>();

  const rows: CheckInRow[] = [];

  for (const item of items) {
    const tokenHash = tokenHashById.get(item.id);
    const visitorId = tokenHash ? visitorIdByHash.get(tokenHash) : undefined;

    if (visitorId) {
      const scannedAt = clampScannedAt(item.scannedAt, EVENT_INFO.startsAt, now);
      rows.push({ id: item.id, visitorId, gameId, scannedAt });
    }
  }

  const insertedIds = rows.length > 0 ? await insert(rows) : new Set<string>();
  const knownIds = new Set(rows.map((row) => row.id));

  if (insertedIds.size > 0) {
    const affectedVisitorIds = [...new Set(rows.flatMap((r) => (insertedIds.has(r.id) ? [r.visitorId] : [])))];

    const awardTickets = deps.awardRaffleTickets ?? checkAndAwardCompletedRaffleTickets;

    try {
      await awardTickets(affectedVisitorIds);
    } catch (error) {
      console.error("Error al procesar boletos automáticos del sorteo:", error);
    }
  }

  return items.map((item) => ({ id: item.id, status: getStatus(item.id, insertedIds, knownIds) }));
}
