import "server-only";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
import { buildVisitorQrUrl } from "@features/visitors/lib/visitor-rules";
import { buildQrCode } from "@shared/lib/qr-code";
import { sendMail } from "@shared/lib/server/mailer";
import { siteConfig } from "@shared/lib/site-config";

/**
 * Genera el marcado SVG del código QR para incrustar en el correo electrónico.
 */
function buildQrSvg(text: string): string {
  const { size, path } = buildQrCode(text);
  const quietZone = 4;
  const side = size + quietZone * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-quietZone} ${-quietZone} ${side} ${side}" width="240" height="240" style="display:block;margin:0 auto;background:#ffffff;border-radius:8px;padding:8px;"><rect x="${-quietZone}" y="${-quietZone}" width="${side}" height="${side}" fill="#ffffff"/><path d="${path}" fill="#000000"/></svg>`;
}

/**
 * Envía por correo la copia del código de acceso personal al registrarse un visitante.
 */
export async function sendVisitorQrEmail(
  email: string,
  fullName: string,
  token: string,
  mailSender: typeof sendMail = sendMail,
): Promise<boolean> {
  const qrUrl = buildVisitorQrUrl(siteConfig.url, token);
  const passportUrl = `${siteConfig.url.replace(/\/$/, "")}${PASSPORT_PATH}`;
  const qrSvg = buildQrSvg(qrUrl);
  const subject = "Tu código de acceso - UT Game Showcase";

  const text = `Hola ${fullName},

Te damos la bienvenida al UT Game Showcase.

Aquí tienes tu código de acceso para recorrer la exhibición de videojuegos:
${qrUrl}

También puedes consultar tu pasaporte digital y ver los juegos que vas probando en:
${passportUrl}

Presenta tu código en cada stand al terminar de probar su juego. Al completar las pruebas de todos los videojuegos, recibirás automáticamente tu número para participar en el sorteo de premios.

¡Que disfrutes el evento!`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; background: #ffffff; border-radius: 8px; border: 1px solid #eaeaea;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 12px;">
        <h1 style="color: #000; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">UT Game Showcase</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Edificio E3 · Universidad Tecnológica</p>
      </div>

      <p style="font-size: 16px; line-height: 1.5; margin: 16px 0;">Hola <strong>${fullName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.5; margin: 16px 0;">Te damos la bienvenida al showcase de videojuegos. Este es tu código personal de visitante:</p>

      <div style="text-align: center; margin: 28px 0; background-color: #f7f7f7; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
        ${qrSvg}
        <p style="margin: 16px 0 0; font-size: 13px; color: #555;">Presenta este código en cada stand para que anoten tu visita.</p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${passportUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">Ver mi pasaporte digital</a>
      </div>

      <div style="background-color: #fcf8e3; border: 1px solid #faebcc; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #8a6d3b; line-height: 1.4;">
          <strong>Importante:</strong> Cuando termines de probar todos los videojuegos de la exhibición, te enviaremos a este correo tu número de boleto para el sorteo de premios.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 28px 0;" />
      <p style="font-size: 11px; color: #999; margin: 0; line-height: 1.4;">UT Game Showcase · Plataforma comunitaria de estudiantes de Tecnologías de la Información.</p>
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

/**
 * Envía por correo el número de boleto para el sorteo al completar todas las pruebas de videojuegos.
 */
export async function sendVisitorRaffleTicketEmail(
  email: string,
  fullName: string,
  ticketNumber: number,
  mailSender: typeof sendMail = sendMail,
): Promise<boolean> {
  const passportUrl = `${siteConfig.url.replace(/\/$/, "")}${PASSPORT_PATH}`;
  const subject = `¡Completaste el recorrido! Tu número para el sorteo es el #${ticketNumber}`;

  const text = `Hola ${fullName},

¡Muchas felicidades! Has probado todos los videojuegos de la exhibición del UT Game Showcase.

Tu número de boleto para el sorteo es:
#${ticketNumber}

Conserva este mensaje. Al momento del sorteo anunciaremos los boletos ganadores en el escenario principal.

Puedes revisar tu boleto y los juegos probados en tu pasaporte:
${passportUrl}

¡Mucha suerte!`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a; background: #ffffff; border-radius: 8px; border: 1px solid #eaeaea;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 12px;">
        <h1 style="color: #000; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">UT Game Showcase</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Gran Sorteo de la Comunidad</p>
      </div>

      <p style="font-size: 16px; line-height: 1.5; margin: 16px 0;">Hola <strong>${fullName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.5; margin: 16px 0;">¡Completaste con éxito las pruebas de todos los videojuegos de la exhibición!</p>

      <div style="text-align: center; margin: 32px 0; background-color: #000000; color: #ffffff; padding: 32px 20px; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #aaaaaa;">Boleto para el sorteo</p>
        <p style="margin: 0; font-size: 48px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">#${ticketNumber}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #444; margin: 16px 0;">
        Guarda este correo o toma una captura de pantalla. Al momento de la rifa en el escenario principal estaremos llamando a los números ganadores.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${passportUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">Ver pasaporte completo</a>
      </div>

      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 28px 0;" />
      <p style="font-size: 11px; color: #999; margin: 0; line-height: 1.4;">UT Game Showcase · Gracias por apoyar los proyectos de los estudiantes.</p>
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
