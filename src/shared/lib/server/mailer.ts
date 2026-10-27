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

  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
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
  const portString = requireEnvVariable(env, "SMTP_PORT");
  const user = requireEnvVariable(env, "SMTP_USER");
  const pass = requireEnvVariable(env, "SMTP_PASSWORD");
  const from = requireEnvVariable(env, "SMTP_FROM");
  const port = Number.parseInt(portString, 10);

  return { host, port, user, pass, from };
}

function requireEnvVariable(env: EnvironmentSource, name: string): string {
  const value = env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Falta configurar la variable de entorno ${name} para el envío de correos.`);
  }

  return value.trim();
}
