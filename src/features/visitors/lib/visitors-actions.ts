"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { parseRecoveryEmail } from "@features/visitors/lib/email-recovery-input";
import { parseRegistrationInput } from "@features/visitors/lib/registration-input";
import { claimRecoveryToken, requestEmailRecovery } from "@features/visitors/lib/server/email-recovery";
import { getRegistrationOpensAt, registerVisitorRecord } from "@features/visitors/lib/server/visitor-registration";
import { VISITOR_PINS_CACHE_TAG } from "@features/visitors/lib/visitor-cache-tags";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH, RECOVERY_LINK_EXPIRED_PATH } from "@features/visitors/lib/visitors-links";
import { readFormText } from "@shared/lib/form-data";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { deliverEmail } from "@shared/lib/server/email-outbox";
import { createSmtpSender } from "@shared/lib/server/mailer";
import { resolveClientIp } from "@shared/lib/server/client-ip";
import { consumeAttempt, refundAttempt } from "@shared/lib/server/rate-limit";
import { setVisitorDeviceCookie } from "@shared/lib/server/visitor-device";

export interface RegistrationState {
  values?: {
    fullName?: string;
    gamertag?: string;
    email?: string;
  };
  fieldErrors?: Partial<Record<"fullName" | "gamertag" | "email", string>>;
  error?: string;
}

export type RecoveryRequestState = { status: "sent" } | { status: "invalid"; email: string; error: string };

const REGISTRATION_RATE_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

export async function registerVisitor(_previous: RegistrationState | null, form: FormData): Promise<RegistrationState> {
  const parsed = parseRegistrationInput(form);

  if (!parsed.ok) {
    return {
      values: {
        fullName: readFormText(form, "fullName"),
        gamertag: readFormText(form, "gamertag"),
        email: readFormText(form, "email"),
      },
      fieldErrors: parsed.fieldErrors,
    };
  }

  const closedError = await checkRegistrationClosed();

  if (closedError) {
    return { values: parsed.value, error: closedError };
  }

  const attemptKey = `register:${await resolveClientIp()}`;
  const attemptedAt = new Date();

  if (!(await consumeAttempt(attemptKey, REGISTRATION_RATE_LIMIT, attemptedAt))) {
    return { values: parsed.value, error: VISITORS_COPY.rateLimited };
  }

  const state = await executeRegistration(parsed.value);

  // A taken gamertag is a typo, not a new passport: the visitor retries and the attempt is given back.
  if (state.fieldErrors?.gamertag) await refundAttempt(attemptKey, REGISTRATION_RATE_LIMIT, attemptedAt);

  return state;
}

async function checkRegistrationClosed(): Promise<string | null> {
  const now = new Date();
  const opensAt = await getRegistrationOpensAt();

  if (!opensAt || now < opensAt) {
    return VISITORS_COPY.errors.closed;
  }

  return null;
}

async function executeRegistration(input: {
  fullName: string;
  gamertag: string;
  email: string;
}): Promise<RegistrationState> {
  const result = await registerVisitorRecord(input, new Date());

  if (result.status === "blocked") {
    return { values: input, error: VISITORS_COPY.genericRejection };
  }

  if (result.status === "gamertagTaken") {
    return {
      values: input,
      fieldErrors: { gamertag: VISITORS_COPY.errors.gamertagTaken },
    };
  }

  // The filter of the kiosks must include the new PIN (RNF-19).
  updateTag(VISITOR_PINS_CACHE_TAG);
  await setVisitorDeviceCookie(result.deviceToken);

  after(async () => {
    await deliverPassportEmailSafely(result.emailId);
  });

  redirect(PASSPORT_PATH);
}

async function deliverPassportEmailSafely(emailId: string): Promise<void> {
  try {
    const send = createSmtpSender();

    await deliverEmail(emailId, send);
  } catch (cause) {
    // Only the message: a nodemailer error can carry the recipient address.
    const message = cause instanceof Error ? cause.message : "Unknown error";

    console.error(`Registration email delivery failed: ${message}`);
  }
}

/**
 * Asks for the recovery link of a passport (RF-68). Only the format of the email is checked before answering; the
 * limit, the lookup and the email run after the response (`after()`), so the answer and its timing are the same
 * whether the email has a passport, has none or reached the limit.
 */
export async function requestRecoveryEmail(
  _previous: RecoveryRequestState | null,
  form: FormData,
): Promise<RecoveryRequestState> {
  const parsed = parseRecoveryEmail(form);

  if (!parsed.ok) return { status: "invalid", email: parsed.email, error: parsed.error };

  const requestedAt = new Date();

  after(async () => {
    await sendRecoveryEmailSafely(parsed.email, requestedAt);
  });

  return { status: "sent" };
}

async function sendRecoveryEmailSafely(email: string, requestedAt: Date): Promise<void> {
  try {
    const emailId = await requestEmailRecovery(email, requestedAt);

    if (emailId) await deliverQueuedEmail(emailId);
  } catch (cause) {
    // Only the message: the address must not reach the logs.
    const message = cause instanceof Error ? cause.message : "Unknown error";

    console.error(`Recovery email request failed: ${message}`);
  }
}

/**
 * Uses the email link on this phone after the visitor confirms (RF-68 and RF-70). Opening the link only shows the
 * confirmation, so a mail scanner that follows links cannot spend it.
 */
export async function claimRecoveryLink(form: FormData): Promise<void> {
  const deviceToken = await claimRecoveryToken(readFormText(form, "token"), new Date());

  if (!deviceToken) redirect(RECOVERY_LINK_EXPIRED_PATH);

  await setVisitorDeviceCookie(deviceToken);
  redirect(PASSPORT_PATH);
}
