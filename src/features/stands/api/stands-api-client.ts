import {
  isPendingVisitResponse,
  isVisitStatusResponse,
  PENDING_VISIT_API_PATH,
  VISIT_STATUS_API_PATH,
  type PendingVisitView,
  type VisitStatus,
} from "@features/stands/lib/pending-visit";
import { isPinFilter, PIN_FILTER_API_PATH, type PinFilter } from "@features/stands/lib/pin-filter";
import { isQueuedVisitsResponse } from "@features/stands/lib/queued-visit-input";
import { QUEUED_VISITS_API_PATH, type QueuedVisit, type QueuedVisitResult } from "@features/stands/lib/visit-queue";

/** The visit the staff is waiting on for the visitor of this device; the answer is never taken from the browser cache. */
export async function fetchPendingVisit(): Promise<PendingVisitView | null> {
  const body = await getJson(PENDING_VISIT_API_PATH, isPendingVisitResponse);

  return body.pending;
}

export function createVisitStatusLoader(pendingVisitId: string): () => Promise<VisitStatus> {
  return async () => {
    const body = await getJson(
      `${VISIT_STATUS_API_PATH}?id=${encodeURIComponent(pendingVisitId)}`,
      isVisitStatusResponse,
    );

    return body.status;
  };
}

/** The filter of the registered PINs, for the kiosk to tell a mistyped PIN apart without connection (RF-78). */
export async function fetchPinFilter(): Promise<PinFilter> {
  return getJson(PIN_FILTER_API_PATH, isPinFilter);
}

/** Sends one batch of the offline queue (at most 50 visits) and returns the answer for each visit (RF-35). */
export async function sendQueuedVisits(visits: QueuedVisit[]): Promise<QueuedVisitResult[]> {
  const response = await fetch(QUEUED_VISITS_API_PATH, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visits }),
  });

  const body = await readJson(response, isQueuedVisitsResponse);

  return body.results;
}

// The body is parsed at the border: what comes back is the type the guard proves, never `unknown`.
async function getJson<Body>(path: string, isBody: (value: unknown) => value is Body): Promise<Body> {
  return readJson(await fetch(path, { cache: "no-store" }), isBody);
}

async function readJson<Body>(response: Response, isBody: (value: unknown) => value is Body): Promise<Body> {
  if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);

  const body: unknown = await response.json();

  if (!isBody(body)) throw new Error("La respuesta del servidor no es válida.");

  return body;
}
