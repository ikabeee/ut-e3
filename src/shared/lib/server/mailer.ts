import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { env, type SmtpConfig } from "@shared/lib/env";

export interface SendMailOptions {
  to: string | readonly string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Crea una nueva instancia de Transporter de Nodemailer con la configuración SMTP provista.
 */
export function createMailerTransporter(config: SmtpConfig): Transporter<SMTPTransport.SentMessageInfo> {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

let cachedTransporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;
let initialized = false;

/**
 * Obtiene el transporter singleton configurado con las variables de entorno.
 * Si las credenciales no están configuradas, devuelve `null`.
 */
export function getMailerTransporter(): Transporter<SMTPTransport.SentMessageInfo> | null {
  if (initialized) {
    return cachedTransporter;
  }

  if (env.smtp) {
    cachedTransporter = createMailerTransporter(env.smtp);
  } else {
    cachedTransporter = null;
  }

  initialized = true;
  return cachedTransporter;
}

/**
 * Restablece el transporter singleton. Útil para pruebas unitarias con distintos entornos.
 */
export function resetMailerTransporter(): void {
  cachedTransporter = null;
  initialized = false;
}

/**
 * Verifica la conectividad y autenticación con el servidor SMTP.
 */
export async function verifyMailerConnection(): Promise<{ success: boolean; error?: string }> {
  const transporter = getMailerTransporter();

  if (!transporter) {
    return {
      success: false,
      error: "No hay configuración SMTP disponible (faltan SMTP_HOST, SMTP_USER o SMTP_PASSWORD).",
    };
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido al conectar con el servidor SMTP.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Envía un correo electrónico vía Nodemailer.
 * Si no hay credenciales SMTP configuradas (en desarrollo local), imprime el contenido en
 * la terminal en lugar de fallar, para facilitar las pruebas sin requerir un servidor de correo.
 */
export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  const transporter = getMailerTransporter();
  const from = options.from || (env.smtp ? env.smtp.from : env.emailFrom);
  const to = Array.isArray(options.to) ? options.to.join(", ") : options.to;

  if (!transporter) {
    console.log("\n==================== [NODEMAILER DEV PREVIEW] ====================");
    console.log(`De:       ${from}`);
    console.log(`Para:     ${to}`);
    console.log(`Asunto:   ${options.subject}`);
    if (options.replyTo) {
      console.log(`Reply-To: ${options.replyTo}`);
    }
    if (options.text) {
      console.log("----------------------- Contenido Texto --------------------------");
      console.log(options.text);
    }
    console.log("==================================================================\n");

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al enviar el correo electrónico.";
    console.error("Error al enviar correo con nodemailer:", error);

    return {
      success: false,
      error: errorMsg,
    };
  }
}
