import "server-only";
import { deliverQueuedEmail } from "@shared/lib/server/email-delivery";
import { enqueueEmail, type OutgoingEmail, type SendEmail } from "@shared/lib/server/email-outbox";
import { createSmtpSender } from "@shared/lib/server/mailer";
import { getPrisma } from "@shared/lib/server/prisma";
import { logServerEvent } from "@shared/lib/server/server-log";
import { siteConfig } from "@shared/lib/site-config";

export interface EmergencyAlert {
  /** Alerts with the same key count as one for the window: an error storm sends a single email. */
  key: string;
  subject: string;
  detail: string;
}

export interface RequestErrorSource {
  method: string;
  path: string;
}

export interface RequestErrorRoute {
  routePath: string;
  routeType: string;
}

type EnvironmentSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

export interface EmergencyAlerterOptions {
  env?: EnvironmentSource;
  now?: () => number;
  queue?: (email: OutgoingEmail) => Promise<string>;
  deliver?: (emailId: string) => Promise<void>;
  sendDirectly?: SendEmail;
}

type SendEmergencyAlert = (alert: EmergencyAlert) => Promise<boolean>;

/** The same alert is sent again only after this long. */
export const EMERGENCY_ALERT_WINDOW_MS = 15 * 60_000;

/** No more than this many alerts of any kind leave in an hour. */
export const MAX_EMERGENCY_ALERTS_PER_HOUR = 10;

const HOUR_MS = 60 * 60_000;

const MAX_DETAIL_LENGTH = 4000;

const COPY = {
  subject: (site: string, subject: string) => `[Emergencia] ${site}: ${subject}`,
  body: (detail: string, server: string, time: string) =>
    `${detail}\n\nServidor: ${server}\nHora (UTC): ${time}\n\nUn aviso igual no se repite durante 15 minutos y salen como máximo ${MAX_EMERGENCY_ALERTS_PER_HOUR} avisos por hora.`,
  requestSubject: (method: string, routePath: string) => `Error en ${method} ${routePath}`,
  requestDetail: (route: RequestErrorRoute, method: string, message: string) =>
    `Ruta: ${route.routePath}\nMétodo: ${method}\nTipo: ${route.routeType}\n\n${message}`,
};

/**
 * Production emergency alerts by email (S20) to the address of `EMERGENCY_MAIL`; without it they do nothing. They go
 * through the outbox like every email, and straight through SMTP when the outbox itself fails (a full disk or a broken
 * database). The alerting path never throws: it runs while something else is already failing.
 */
export function createEmergencyAlerter(options: EmergencyAlerterOptions = {}): SendEmergencyAlert {
  const env = options.env ?? process.env;
  const now = options.now ?? Date.now;
  const allows = createAlertLimiter();
  const queue = options.queue ?? queueInOutbox;
  const deliver = options.deliver ?? deliverQueuedEmail;
  const sendDirectly = options.sendDirectly ?? ((email: OutgoingEmail) => sendThroughSmtp(env, email));

  return async function sendEmergencyAlert(alert) {
    const to = env.EMERGENCY_MAIL?.trim();

    if (!to || !allows(alert.key, now())) return false;

    const email = buildAlertEmail(to, alert, now());

    await logServerEvent("warn", "emergency", `Emergency alert sent: ${alert.subject}`, { key: alert.key });

    try {
      await deliver(await queue(email));
    } catch (cause) {
      logFailure(cause);
      await sendDirectly(email).catch(logFailure);
    }

    return true;
  };
}

export const sendEmergencyAlert = createEmergencyAlerter();

/** An error that Next.js caught in a request. It names the route file, never the visited path, which can hold a token. */
export function describeRequestError(
  cause: unknown,
  request: RequestErrorSource,
  route: RequestErrorRoute,
): EmergencyAlert {
  const message = cause instanceof Error ? cause.message : String(cause);
  const stack = cause instanceof Error && cause.stack ? `\n\n${cause.stack}` : "";

  return {
    key: `request:${route.routePath}:${message.slice(0, 200)}`,
    subject: COPY.requestSubject(request.method, route.routePath),
    detail: COPY.requestDetail(route, request.method, `${message}${stack}`),
  };
}

// Remembers when each key was last sent and every send of the last hour; old entries leave on each call.
function createAlertLimiter() {
  const lastSentByKey = new Map<string, number>();
  let recentSends: number[] = [];

  return function allows(key: string, at: number): boolean {
    recentSends = recentSends.filter((sentAt) => at - sentAt < HOUR_MS);

    for (const [storedKey, sentAt] of lastSentByKey) {
      if (at - sentAt >= EMERGENCY_ALERT_WINDOW_MS) lastSentByKey.delete(storedKey);
    }

    if (lastSentByKey.has(key) || recentSends.length >= MAX_EMERGENCY_ALERTS_PER_HOUR) return false;

    lastSentByKey.set(key, at);
    recentSends.push(at);

    return true;
  };
}

function queueInOutbox(email: OutgoingEmail): Promise<string> {
  return enqueueEmail(getPrisma(), email, { kind: "emergency" });
}

function buildAlertEmail(to: string, alert: EmergencyAlert, at: number): OutgoingEmail {
  return {
    to,
    subject: COPY.subject(siteConfig.name, alert.subject),
    text: COPY.body(alert.detail.slice(0, MAX_DETAIL_LENGTH), siteConfig.url, new Date(at).toISOString()),
  };
}

async function sendThroughSmtp(env: EnvironmentSource, email: OutgoingEmail): Promise<void> {
  if (!env.SMTP_HOST) return;

  await createSmtpSender(env)(email);
}

// Only the message: a mailer error can carry the address.
function logFailure(cause: unknown): void {
  console.error(`Emergency alert failed: ${cause instanceof Error ? cause.message : "Unknown error"}`);
}
