import "server-only";
import nodemailer from "nodemailer";
import { CONFIRM_EMAIL_PATH } from "@features/auth/lib/auth-links";
import { siteConfig } from "@shared/lib/site-config";

function getTransporter() {
  const host = process.env["SMTP_HOST"];
  const port = Number(process.env["SMTP_PORT"] || "587");
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASSWORD"];

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Envía el correo de confirmación de cuenta con nodemailer.
 * Si no hay credenciales SMTP configuradas en local, imprime el enlace directamente
 * en la consola para facilitar el desarrollo.
 */
export async function sendConfirmationEmail(email: string, fullName: string, token: string): Promise<boolean> {
  const confirmUrl = `${siteConfig.url}${CONFIRM_EMAIL_PATH}?token=${token}`;
  const from = process.env["EMAIL_FROM"] || `"UTG Showcase" <no-reply@showcase.ute3.edu.mx>`;
  const subject = "Confirma tu cuenta - UT Game Showcase";

  const transporter = getTransporter();

  if (!transporter) {
    console.log("\n=======================================================");
    console.log(`[EMAIL DEV] Para: ${fullName} <${email}>`);
    console.log(`[EMAIL DEV] Asunto: ${subject}`);
    console.log(`[EMAIL DEV] Enlace de confirmación: ${confirmUrl}`);
    console.log("=======================================================\n");

    return true;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #ffffff; border-radius: 8px; border: 1px solid #eaeaea;">
      <h2 style="color: #000; margin-top: 0;">UT Game Showcase</h2>
      <p>Hola <strong>${fullName}</strong>,</p>
      <p>Gracias por registrar a tu equipo en el showcase de videojuegos. Para activar tu cuenta y poder acceder al portal de escáner de tu stand, confirma tu correo electrónico dando clic en el siguiente enlace:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${confirmUrl}" style="background-color: #0070f3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar mi correo</a>
      </div>
      <p style="font-size: 13px; color: #666;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p style="font-size: 12px; color: #888; word-break: break-all;"><a href="${confirmUrl}">${confirmUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;" />
      <p style="font-size: 11px; color: #999; margin-bottom: 0;">Si no solicitaste este registro, puedes ignorar este correo.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Error al enviar correo con nodemailer:", error);

    return false;
  }
}
