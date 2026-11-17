import "server-only";

import { createTransport } from "nodemailer";
import type { SendEmail } from "@shared/lib/server/email-outbox";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

type EnvironmentSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

export function createSmtpSender(env: EnvironmentSource = process.env): SendEmail {
  const config = readSmtpConfig(env);
  const isDirectTls = config.port === 465;

  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: isDirectTls,
    requireTLS: !isDirectTls,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return async function sendEmail({ to, subject, text }) {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
    });
  };
}

function readSmtpConfig(env: EnvironmentSource): SmtpConfig {
  const host = requireEnvVariable(env, "SMTP_HOST");
  const port = parseSmtpPort(env);
  const user = requireEnvVariable(env, "SMTP_USER");
  const pass = requireEnvVariable(env, "SMTP_PASSWORD");
  const from = parseSmtpFrom(env);

  return { host, port, user, pass, from };
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

function requireEnvVariable(env: EnvironmentSource, name: string): string {
  const value = env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Falta configurar la variable de entorno ${name} para el envío de correos.`);
  }

  return value.trim();
}
