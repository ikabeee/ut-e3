import "server-only";
import type { findScannerGame, recordCheckIns, ScannerGame } from "@features/visitors/lib/server/check-ins-queries";
import { type CheckInBatchPayload, parseCheckInBatch } from "@features/visitors/lib/visitor-rules";
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

function describeGame(game: ScannerGame) {
  return { name: game.gameName, standCode: game.standCode };
}

export interface CheckInsRouteDependencies {
  findGame?: typeof findScannerGame;
  saveCheckIns?: typeof recordCheckIns;
}

const defaultFindScannerGame: typeof findScannerGame = async (key) =>
  (await import("@features/visitors/lib/server/check-ins-queries")).findScannerGame(key);

const defaultRecordCheckIns: typeof recordCheckIns = async (gameId, checkIns) =>
  (await import("@features/visitors/lib/server/check-ins-queries")).recordCheckIns(gameId, checkIns);

export function createCheckInsRoute(deps: CheckInsRouteDependencies = {}) {
  const findGame = deps.findGame ?? defaultFindScannerGame;
  const saveCheckIns = deps.saveCheckIns ?? defaultRecordCheckIns;

  async function authenticateScanner(request: Request) {
    return findGame(request.headers.get(SCANNER_KEY_HEADER)?.trim().toLowerCase() ?? "");
  }

  async function handleGet(request: Request) {
    const game = await authenticateScanner(request);

    if (!game) return errorResponse(401, UNAUTHORIZED);

    return Response.json({ game: describeGame(game) }, { headers: NO_STORE });
  }

  async function handlePost(request: Request) {
    const game = await authenticateScanner(request);

    if (!game) return errorResponse(401, UNAUTHORIZED);

    let body: CheckInBatchPayload | null | undefined;

    try {
      // SAFETY: El cuerpo JSON se valida campo por campo mediante parseCheckInBatch.
      body = (await request.json()) as CheckInBatchPayload;
    } catch {
      return errorResponse(400, "El cuerpo debe ser JSON.");
    }

    try {
      const results = await saveCheckIns(game.gameId, parseCheckInBatch(body));

      return Response.json({ game: describeGame(game), results }, { headers: NO_STORE });
    } catch (error) {
      if (error instanceof ValidationError) return errorResponse(400, error.message, error.fieldErrors);
      throw error;
    }
  }

  return { GET: handleGet, POST: handlePost };
}

const defaultRoutes = createCheckInsRoute();

export const GET = defaultRoutes.GET;

export const POST = defaultRoutes.POST;
