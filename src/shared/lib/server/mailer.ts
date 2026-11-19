import "server-only";

import { createTransport } from "nodemailer";
import type { SendEmail } from "@shared/lib/server/email-outbox";
import { renderEmailHtml } from "@shared/lib/server/email-template";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  ehloName: string | undefined;
}

type EnvironmentSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

export function createSmtpSender(env: EnvironmentSource = process.env): SendEmail {
  const config = readSmtpConfig(env);
  const isDirectTls = config.port === 465;

  // The relay of Google Workspace closes the connection (421 4.7.0) when the greeting is not a real domain, and the
  // default greeting is the hostname of the container.
  const transporter = createTransport({
    name: config.ehloName,
    host: config.host,
    port: config.port,
    secure: isDirectTls,
    requireTLS: !isDirectTls,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  // Every email leaves with the template of the site (S1) and its plain text as the alternative part.
  return async function sendEmail({ to, subject, text }) {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html: renderEmailHtml({ subject, text }),
    });
  };
}

function readSmtpConfig(env: EnvironmentSource): SmtpConfig {
  const host = requireEnvVariable(env, "SMTP_HOST");
  const port = parseSmtpPort(env);
  const user = requireEnvVariable(env, "SMTP_USER");
  const pass = requireEnvVariable(env, "SMTP_PASSWORD");
  const from = parseSmtpFrom(env);
  const ehloName = readEhloName(env);

  return { host, port, user, pass, from, ehloName };
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

function readEhloName(env: EnvironmentSource): string | undefined {
  const name = env.SMTP_EHLO_NAME?.trim();

  if (name) return name;

  return URL.parse(env.NEXT_PUBLIC_SITE_URL ?? "")?.hostname || undefined;
}

function requireEnvVariable(env: EnvironmentSource, name: string): string {
  const value = env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Falta configurar la variable de entorno ${name} para el envío de correos.`);
  }

  return value.trim();
}
