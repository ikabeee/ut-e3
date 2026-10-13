import "server-only";
import { findScannerGame, recordCheckIns, type ScannerGame } from "@features/visitors/lib/server/check-ins-queries";
import { parseCheckInBatch } from "@features/visitors/lib/visitor-rules";
import { ValidationError } from "@shared/lib/validation";

// Endpoint del escáner del stand (`src/app/api/check-ins/route.ts` sólo lo re-exporta). La llave
// del escáner viaja en el encabezado `x-scanner-key`, nunca en la URL (no queda en logs ni en el
// historial).

export const SCANNER_KEY_HEADER = "x-scanner-key";

const NO_STORE = { "Cache-Control": "no-store" };

const UNAUTHORIZED = "La llave del escáner no es válida o su equipo todavía no registra su juego.";

function errorResponse(status: number, error: string, fieldErrors?: Record<string, string>) {
  return Response.json(fieldErrors ? { error, fieldErrors } : { error }, { status, headers: NO_STORE });
}

async function authenticateScanner(request: Request) {
  return findScannerGame(request.headers.get(SCANNER_KEY_HEADER)?.trim().toLowerCase() ?? "");
}

function describeGame(game: ScannerGame) {
  return { name: game.gameName, standCode: game.standCode };
}

/** `GET /api/check-ins`: el escáner comprueba su llave y a qué juego registra los escaneos. */
export async function GET(request: Request) {
  const game = await authenticateScanner(request);

  if (!game) return errorResponse(401, UNAUTHORIZED);

  return Response.json({ game: describeGame(game) }, { headers: NO_STORE });
}

/**
 * `POST /api/check-ins`: guarda un lote `{ checkIns: [{ id, token, scannedAt }] }` y responde el
 * estado de cada escaneo (`created`, `duplicate` o `unknown`). Se puede reenviar el mismo lote.
 */
export async function POST(request: Request) {
  const game = await authenticateScanner(request);

  if (!game) return errorResponse(401, UNAUTHORIZED);

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "El cuerpo debe ser JSON.");
  }

  try {
    const results = await recordCheckIns(game.gameId, parseCheckInBatch(body));

    return Response.json({ game: describeGame(game), results }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ValidationError) return errorResponse(400, error.message, error.fieldErrors);
    throw error;
  }
}
