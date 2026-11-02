"use server";

import { requireStandAccount } from "@features/accounts/lib/server/current-account";
import {
  cancelPendingVisit,
  requestVisit,
  answerPendingVisit,
} from "@features/stands/lib/server/pending-visit-mutations";
import { registerVisit } from "@features/stands/lib/server/visit-mutations";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { parsePin, parseRatings } from "@features/stands/lib/survey-input";
import { readFormText } from "@shared/lib/form-data";
import { consumeAttempt } from "@shared/lib/server/rate-limit";
import { getDeviceVisitorId } from "@shared/lib/server/visitor-device";

export interface ActionError {
  status: "error";
  message: string;
}

export type RequestVisitState = { status: "waiting"; pin: string; pendingVisitId: string } | ActionError;

export type VisitActionState = { status: "done"; message: string } | ActionError;

const COPY = STANDS_COPY.kiosk;

// A kiosk serves one visitor a minute at most, so this never stops a real queue; it stops someone guessing PINs.
const ATTEMPT_RULE = { limit: 100, windowMs: 5 * 60 * 1000 };

const ANSWER_RULE = { limit: 20, windowMs: 5 * 60 * 1000 };

// Server Actions are public endpoints: each one checks that the session is a stand account before reading the form.
export async function requestVisitAction(
  _previous: RequestVisitState | null,
  form: FormData,
): Promise<RequestVisitState> {
  const account = await requireStandAccount();
  const pin = parsePin(readFormText(form, "pin"));

  if (!pin) return failure(COPY.errors.pinFormat);

  if (!(await consumeAttempt(`kiosk:${account.id}`, ATTEMPT_RULE))) return failure(COPY.errors.tooManyAttempts);

  const result = await requestVisit({ standId: account.standId, scannedById: account.id, pin }, new Date());

  return result.status === "requested"
    ? { status: "waiting", pin, pendingVisitId: result.pendingVisitId }
    : failure(COPY.errors[result.status]);
}

export async function cancelVisitAction(pendingVisitId: string): Promise<void> {
  const account = await requireStandAccount();

  await cancelPendingVisit(pendingVisitId, account.standId);
}

// The fallback of the kiosk: the visitor rates on the staff screen when the phone has no signal.
export async function submitVisitAction(_previous: VisitActionState | null, form: FormData): Promise<VisitActionState> {
  const account = await requireStandAccount();
  const pin = parsePin(readFormText(form, "pin"));
  const ratings = parseRatings(form);

  if (!pin) return failure(COPY.errors.pinFormat);

  if (!ratings) return failure(COPY.errors.ratingsRequired);

  if (!(await consumeAttempt(`kiosk:${account.id}`, ATTEMPT_RULE))) return failure(COPY.errors.tooManyAttempts);

  const result = await registerVisit({ standId: account.standId, scannedById: account.id, pin, ratings }, new Date());

  return result.status === "registered"
    ? { status: "done", message: COPY.thanks.message }
    : failure(COPY.errors[result.status]);
}

// The visitor answers from the passport: the device cookie says who it is, and the pending visit says where.
export async function answerVisitAction(_previous: VisitActionState | null, form: FormData): Promise<VisitActionState> {
  const visitorId = await getDeviceVisitorId();

  if (!visitorId) return failure(COPY.errors.missingDevice);

  const ratings = parseRatings(form);

  if (!ratings) return failure(COPY.errors.ratingsRequired);

  if (!(await consumeAttempt(`survey:${visitorId}`, ANSWER_RULE))) return failure(COPY.errors.tooManyAttempts);

  const result = await answerPendingVisit(visitorId, ratings, new Date());

  return result.status === "registered"
    ? { status: "done", message: STANDS_COPY.passportSurvey.thanks }
    : failure(COPY.errors[result.status]);
}

function failure(message: string): ActionError {
  return { status: "error", message };
}
