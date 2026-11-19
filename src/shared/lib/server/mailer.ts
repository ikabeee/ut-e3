import "server-only";

import { createTransport } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";
import { siteConfig } from "@shared/lib/site-config";
import type { SendEmail } from "@shared/lib/server/email-outbox";
import { renderEmailHtml } from "@shared/lib/server/email-template";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  ehloName: string | undefined;
}

// Gmail limits how fast an account sends; one message every 2 seconds stays far from it.
const SEND_SPACING_MS = 2000;

type EnvironmentSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

/**
 * The sender of the emails. Every call with the same configuration answers the same sender, so the worker, the
 * after-response delivery and the sysadmin's tools share one pooled connection instead of opening one per email.
 */
export function createSmtpSender(env: EnvironmentSource = process.env): SendEmail {
  const options = buildSmtpTransportOptions(env);
  const key = JSON.stringify(options);
  const cached = getSenders().get(key);

  if (cached) return cached;

  const sender = createSender(options, parseSmtpFrom(env));

  getSenders().set(key, sender);

  return sender;
}

/**
 * One connection, reused for every message (a connection per email makes Gmail answer `421 4.7.0 Try again later` at
 * the EHLO), and at most one message every 2 seconds. A relay of Google Workspace also closes the connection when the
 * greeting is not a real domain, and the default greeting is the hostname of the container.
 */
export function buildSmtpTransportOptions(env: EnvironmentSource, siteUrl: string = siteConfig.url): SMTPPool.Options {
  const config = readSmtpConfig(env, siteUrl);
  const isDirectTls = config.port === 465;

  return {
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: SEND_SPACING_MS,
    rateLimit: 1,
    name: config.ehloName,
    host: config.host,
    port: config.port,
    secure: isDirectTls,
    requireTLS: !isDirectTls,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };
}

// The server keeps instrumentation.ts, the Server Actions and the Route Handlers in separate bundles: the senders live
// on globalThis, like the Prisma client and the job registry, so all of them share the same connection.
const processGlobal: typeof globalThis & { smtpSenders?: Map<string, SendEmail> } = globalThis;

function getSenders(): Map<string, SendEmail> {
  processGlobal.smtpSenders ??= new Map();

  return processGlobal.smtpSenders;
}

function createSender(options: SMTPPool.Options, from: string): SendEmail {
  // The options come from buildSmtpTransportOptions, which sets direct TLS on 465 and requireTLS on every other port.
  // eslint-disable-next-line sonarjs/no-clear-text-protocols
  const transporter = createTransport(options);

  // Every email leaves with the template of the site (S1) and its plain text as the alternative part.
  return async function sendEmail({ to, subject, text }) {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: renderEmailHtml({ subject, text }),
    });
  };
}

function readSmtpConfig(env: EnvironmentSource, siteUrl: string): SmtpConfig {
  const host = requireEnvVariable(env, "SMTP_HOST");
  const port = parseSmtpPort(env);
  const user = requireEnvVariable(env, "SMTP_USER");
  const pass = requireEnvVariable(env, "SMTP_PASSWORD");
  const ehloName = readEhloName(env, siteUrl);

  return { host, port, user, pass, ehloName };
}

function parseSmtpPort(env: EnvironmentSource): number {
  const portString = requireEnvVariable(env, "SMTP_PORT");

  if (!/^\d+$/.test(portString)) {
    throw new Error("La variable de entorno SMTP_PORT debe ser un número entero entre 1 y 65535.");
  }

  const port = Number.parseInt(portString, 10);

  if (port < 1 || port > 65_535) {
    throw new Error("La variable de entorno SMTP_PORT debe ser un número entero entre 1 y 65535.");
  }

  return port;
}

function parseSmtpFrom(env: EnvironmentSource): string {
  const from = requireEnvVariable(env, "SMTP_FROM");
  const hasAddress = /^[^\s<>@]+@[^\s<>@]+$/.test(from) || /<[^\s<>@]+@[^\s<>@]+>$/.test(from);

  if (!hasAddress) {
    throw new Error(
      'La variable de entorno SMTP_FROM debe incluir una dirección de correo, por ejemplo "UT Game Showcase <no-reply@tu-dominio.mx>".',
    );
  }

  return from;
}

// SMTP_EHLO_NAME, then the site of the environment, then the site the build was made for (the runtime may lack the
// variable). A development build points to localhost, which is not a name a relay accepts.
function readEhloName(env: EnvironmentSource, siteUrl: string): string | undefined {
  const name = env.SMTP_EHLO_NAME?.trim();

  if (name) return name;

  const runtimeHost = URL.parse(env.NEXT_PUBLIC_SITE_URL ?? "")?.hostname;

  if (runtimeHost) return runtimeHost;

  const buildHost = URL.parse(siteUrl)?.hostname;

  return buildHost === "localhost" ? undefined : buildHost || undefined;
}

function requireEnvVariable(env: EnvironmentSource, name: string): string {
  const value = env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Falta configurar la variable de entorno ${name} para el envío de correos.`);
  }

  return value.trim();
}
