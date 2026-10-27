"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { parseRegistrationInput } from "@features/visitors/lib/registration-input";
import { getRegistrationOpensAt, registerVisitorRecord } from "@features/visitors/lib/server/visitor-registration";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
import { readFormText } from "@shared/lib/form-data";
import { deliverEmail } from "@shared/lib/server/email-outbox";
import { createSmtpSender } from "@shared/lib/server/mailer";
import { consumeAttempt } from "@shared/lib/server/rate-limit";
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

  const clientIp = await resolveClientIp();
  const allowed = await consumeAttempt(`register:${clientIp}`, REGISTRATION_RATE_LIMIT);

  if (!allowed) {
    return { values: parsed.value, error: VISITORS_COPY.rateLimited };
  }

  return executeRegistration(parsed.value);
}

async function checkRegistrationClosed(): Promise<string | null> {
  const now = new Date();
  const opensAt = await getRegistrationOpensAt();

  if (!opensAt || now < opensAt) {
    return VISITORS_COPY.errors.closed;
  }

  return null;
}

async function resolveClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");

  if (!forwarded) {
    return "unknown";
  }

  return forwarded.split(",")[0].trim() || "unknown";
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
