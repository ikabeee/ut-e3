import "server-only";
import { CONFIRM_EMAIL_PATH } from "@features/auth/lib/auth-links";
import { siteConfig } from "@shared/lib/site-config";
import { sendMail } from "@shared/lib/server/mailer";

/**
 * Envía el correo de confirmación de cuenta con nodemailer (vía `@shared/lib/server/mailer`).
 * Si no hay credenciales SMTP configuradas en local, imprime el enlace directamente
 * en la consola para facilitar el desarrollo.
 */
export async function sendConfirmationEmail(
  email: string,
  fullName: string,
  token: string,
  mailSender: typeof sendMail = sendMail,
): Promise<boolean> {
  const confirmUrl = `${siteConfig.url}${CONFIRM_EMAIL_PATH}?token=${token}`;
  const subject = "Activa tu cuenta y establece tu contraseña - UT Game Showcase";

  const text = `Hola ${fullName},

Has sido registrado como líder de equipo en el UT Game Showcase.
Para activar tu cuenta y establecer tu contraseña de acceso, ingresa al siguiente enlace:

${confirmUrl}

Si el enlace no funciona directamente, cópialo y pégalo en la barra de tu navegador.

Si no solicitaste este registro, puedes ignorar este mensaje.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; background: #ffffff; border-radius: 8px; border: 1px solid #eaeaea;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 12px;">
        <h1 style="color: #000; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">UT Game Showcase</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">División de Ingeniería y Tecnologías · UT Cancún</p>
      </div>
      <p style="font-size: 15px; line-height: 1.5; margin: 16px 0;">Hola <strong>${fullName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.5; margin: 16px 0;">Has sido registrado como líder de equipo en el showcase de videojuegos. Para activar tu cuenta y establecer tu contraseña de acceso, da clic en el siguiente botón:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${confirmUrl}" style="background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">Establecer contraseña y activar cuenta</a>
      </div>
      <p style="font-size: 13px; color: #666; line-height: 1.5;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p style="font-size: 12px; color: #0070f3; word-break: break-all;"><a href="${confirmUrl}" style="color: #0070f3;">${confirmUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 28px 0;" />
      <p style="font-size: 11px; color: #999; margin: 0; line-height: 1.4;">Si no solicitaste este registro, puedes ignorar este mensaje.</p>
    </div>
  `;

  const result = await mailSender({
    to: email,
    subject,
    text,
    html,
  });

  return result.success;
}
