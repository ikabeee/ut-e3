"use client";

import { useCallback } from "react";
import type { PinFilterCheck } from "@features/stands/hooks/use-pin-filter";
import type { RequestVisitState, VisitActionState } from "@features/stands/lib/stands-actions";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { parsePin, parseRatings } from "@features/stands/lib/survey-input";
import { createVisitId, type QueuedVisit } from "@features/stands/lib/visit-queue";
import { readFormText } from "@shared/lib/form-data";

/** What the PIN screen leads to: the wait for the phone, an error, or the survey of a visit that goes to the queue. */
export type KioskRequestState = RequestVisitState | { status: "offline"; pin: string };

/** What the kiosk needs to keep taking visits without connection (RF-35, RF-78). */
export interface OfflineKiosk {
  checkPin: PinFilterCheck;
  enqueue: (visit: QueuedVisit) => Promise<void>;
}

type RequestVisit = (previous: RequestVisitState | null, form: FormData) => Promise<RequestVisitState>;

type SubmitVisit = (previous: VisitActionState | null, form: FormData) => Promise<VisitActionState>;

const COPY = STANDS_COPY.kiosk;

/**
 * The action of the PIN screen. With a network it asks the server, as always; without one, or when the request does not
 * get through, the filter decides: a PIN that does not pass it never opens the survey (RF-78).
 */
export function useRequestOrOffline(requestVisit: RequestVisit, offline: OfflineKiosk) {
  return useCallback(
    async (previous: KioskRequestState | null, form: FormData): Promise<KioskRequestState> => {
      const pin = parsePin(readFormText(form, "pin"));

      if (!pin) return failure(COPY.errors.pinFormat);

      if (navigator.onLine) {
        try {
          return await requestVisit(toRequestState(previous), form);
        } catch {
          // The server did not answer: the visit goes on as an offline one.
        }
      }

      return (await offline.checkPin(pin)) ? { status: "offline", pin } : failure(COPY.errors.unknownPin);
    },
    [requestVisit, offline],
  );
}

/** The survey of a visit taken without connection: it goes to the queue and the kiosk only says thanks (RF-29). */
export function useQueuedSurvey(pin: string, offline: OfflineKiosk) {
  return useCallback(
    async (_previous: VisitActionState | null, form: FormData) => queueSurvey({ pin, form, offline }),
    [pin, offline],
  );
}

/** The survey answered on the kiosk screen while online; when the request does not get through, it goes to the queue. */
export function useSubmitOrQueue(submitVisit: SubmitVisit, pin: string, offline: OfflineKiosk) {
  return useCallback(
    async (previous: VisitActionState | null, form: FormData): Promise<VisitActionState> => {
      if (navigator.onLine) {
        try {
          return await submitVisit(previous, form);
        } catch {
          // The server did not answer: the visit is kept in the queue.
        }
      }

      return queueSurvey({ pin, form, offline });
    },
    [submitVisit, pin, offline],
  );
}

async function queueSurvey({ pin, form, offline }: { pin: string; form: FormData; offline: OfflineKiosk }) {
  const ratings = parseRatings(form);

  if (!ratings) return failure(COPY.errors.ratingsRequired);

  try {
    await offline.enqueue({ id: createVisitId(), pin, ratings, scannedAt: new Date().toISOString() });
  } catch {
    return failure(COPY.errors.queueFailed);
  }

  return { status: "done", message: COPY.offline.queuedThanks } satisfies VisitActionState;
}

function toRequestState(previous: KioskRequestState | null): RequestVisitState | null {
  return previous?.status === "offline" ? null : previous;
}

function failure(message: string) {
  return { status: "error", message } as const;
}
