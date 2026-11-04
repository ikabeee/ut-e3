import "server-only";
import { getStandAccount } from "@features/accounts/lib/server/current-account";
import { isQueuedVisitsRequest, readQueuedVisitBatch } from "@features/stands/lib/queued-visit-input";
import { registerQueuedVisits } from "@features/stands/lib/server/queued-visit-mutations";
import { consumeAttempt } from "@shared/lib/server/rate-limit";

const NO_STORE = { "Cache-Control": "no-store" };

// A kiosk that comes back online sends a batch every few seconds at most; the limit only stops a script.
const BATCH_RULE = { limit: 60, windowMs: 5 * 60 * 1000 };

/**
 * Receives a batch of the offline queue of a kiosk (RF-35). The stand and the staff account come from the session, never
 * from the body: a kiosk only records visits at its own stand (RF-33, RF-36). The session cookie is SameSite=Lax, so a
 * cross-site POST arrives without it and gets 401.
 */
export async function POST(request: Request): Promise<Response> {
  const account = await getStandAccount();

  if (!account) return refuse("Sin sesión de stand.", 401);

  const body: unknown = await request.json().catch(() => null);

  if (!isQueuedVisitsRequest(body)) return refuse("El lote no es válido.", 400);

  const batch = readQueuedVisitBatch(body);

  if (batch.status === "tooLarge") return refuse("Un lote lleva como máximo 50 visitas.", 413);

  if (!(await consumeAttempt(`kiosk-queue:${account.id}`, BATCH_RULE))) return refuse("Demasiados lotes.", 429);

  const results = await registerQueuedVisits(
    { standId: account.standId, scannedById: account.id, entries: batch.entries },
    new Date(),
  );

  return Response.json({ results }, { headers: NO_STORE });
}

function refuse(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: NO_STORE });
}
