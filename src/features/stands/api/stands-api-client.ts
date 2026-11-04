import {
  isPendingVisitResponse,
  isVisitStatusResponse,
  PENDING_VISIT_API_PATH,
  VISIT_STATUS_API_PATH,
  type PendingVisitView,
  type VisitStatus,
} from "@features/stands/lib/pending-visit";
import { fetchJson } from "@shared/lib/fetch-json";

/** The visit the staff is waiting on for the visitor of this device; the answer is never taken from the browser cache. */
export async function fetchPendingVisit(): Promise<PendingVisitView | null> {
  const body = await fetchJson(PENDING_VISIT_API_PATH, isPendingVisitResponse);

  return body.pending;
}

export function createVisitStatusLoader(pendingVisitId: string): () => Promise<VisitStatus> {
  return async () => {
    const body = await fetchJson(
      `${VISIT_STATUS_API_PATH}?id=${encodeURIComponent(pendingVisitId)}`,
      isVisitStatusResponse,
    );

    return body.status;
  };
}
