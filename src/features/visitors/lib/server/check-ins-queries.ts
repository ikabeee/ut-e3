import "server-only";
import { EVENT_INFO } from "@features/event/lib/event-info";
import type { CheckInItem, CheckInResult, CheckInStatus } from "@features/visitors/lib/types";
import { clampScannedAt, extractVisitorToken } from "@features/visitors/lib/visitor-rules";
import { db } from "@shared/lib/prisma/db";
import { hashSecret } from "@shared/lib/server/secrets";

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

/**
 * Guarda un lote de escaneos del juego. Los QR desconocidos se descartan sin abortar el lote
 * y `ON CONFLICT DO NOTHING` (sin columna) ignora tanto un reenvío (mismo id) como un segundo
 * escaneo del mismo visitante en el mismo stand.
 */
export async function recordCheckIns(
  gameId: string,
  items: readonly CheckInItem[],
  now = new Date(),
): Promise<CheckInResult[]> {
  const tokenHashById = new Map(
    items.flatMap((item) => {
      const token = extractVisitorToken(item.token);
      return token ? [[item.id, hashSecret(token)] as const] : [];
    }),
  );
  const tokenHashes = [...new Set(tokenHashById.values())];
  const visitors =
    tokenHashes.length > 0
      ? await db.orm.public.Visitor.select("id", "qrTokenHash")
          .where((visitor) => visitor.qrTokenHash.in(tokenHashes))
          .all()
      : [];
  const visitorIdByHash = new Map(visitors.map((visitor) => [visitor.qrTokenHash, visitor.id]));

  const rows = items.flatMap((item) => {
    const tokenHash = tokenHashById.get(item.id);
    const visitorId = tokenHash ? visitorIdByHash.get(tokenHash) : undefined;
    if (!visitorId) return [];
    return [{ id: item.id, visitorId, gameId, scannedAt: clampScannedAt(item.scannedAt, EVENT_INFO.startsAt, now) }];
  });

  const inserted =
    rows.length > 0 ? await db.orm.public.CheckIn.select("id").createAll(rows, { onConflict: "skip" }) : [];
  const insertedIds = new Set(inserted.map((row) => row.id));
  const knownIds = new Set(rows.map((row) => row.id));

  return items.map((item) => ({ id: item.id, status: getStatus(item.id, insertedIds, knownIds) }));
}
