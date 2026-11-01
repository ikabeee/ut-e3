import {
  isPendingVisitResponse,
  isVisitStatusResponse,
  PENDING_VISIT_API_PATH,
  VISIT_STATUS_API_PATH,
  type PendingVisitView,
  type VisitStatus,
} from "@features/stands/lib/pending-visit";

/** The visit the staff is waiting on for the visitor of this device; the answer is never taken from the browser cache. */
export async function fetchPendingVisit(): Promise<PendingVisitView | null> {
  const body = await getJson(PENDING_VISIT_API_PATH);

  if (!isPendingVisitResponse(body)) throw new Error("La respuesta del servidor no es válida.");

  return body.pending;
}

export function createVisitStatusLoader(pendingVisitId: string): () => Promise<VisitStatus> {
  return async () => {
    const body = await getJson(`${VISIT_STATUS_API_PATH}?id=${encodeURIComponent(pendingVisitId)}`);

    if (!isVisitStatusResponse(body)) throw new Error("La respuesta del servidor no es válida.");

    return body.status;
  };
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);

  return response.json();
}
