/**
 * Script interactivo / CLI para probar la configuración de Node Mailer.
 *
 * Uso:
 *   npm run email:test                                # Verifica conexión SMTP
 *   npm run email:test -- usuario@correo.com          # Envía correo de prueba
 */
import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
  const host = process.env["SMTP_HOST"]?.trim();
  const rawPort = process.env["SMTP_PORT"]?.trim();
  const port = rawPort ? Number(rawPort) : 587;
  const user = process.env["SMTP_USER"]?.trim();
  const pass = process.env["SMTP_PASSWORD"];

  const secure =
    process.env["SMTP_SECURE"] !== undefined
      ? process.env["SMTP_SECURE"].trim().toLowerCase() === "true"
      : port === 465;

  const from = process.env["EMAIL_FROM"]?.trim() || '"UT Game Showcase" <no-reply@showcase.ute3.edu.mx>';

  console.log("=================================================");
  console.log(" Verificación de configuración SMTP / Nodemailer");
  console.log("=================================================");
  console.log(`Host:    ${host || "(no configurado)"}`);
  console.log(`Puerto:  ${port}`);
  console.log(`Seguro:  ${secure ? "Sí (SSL/TLS)" : "No (STARTTLS)"}`);
  console.log(`Usuario: ${user || "(no configurado)"}`);
  console.log(`De:      ${from}`);
  console.log("=================================================\n");

  if (!host || !user || !pass) {
    console.warn("⚠️  Credenciales SMTP incompletas en las variables de entorno.");
    console.warn("   Para enviar correos reales, configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD en tu archivo .env.");
    console.log("   (En desarrollo local sin SMTP, la app imprime los correos en la terminal automáticamente).\n");

    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  console.log("Probando conexión con el servidor SMTP...");

  try {
    await transporter.verify();
    console.log("✅ Conexión SMTP verificada con éxito.\n");
  } catch (error) {
    console.error("❌ Error de autenticación o conexión SMTP:", error);
    process.exit(1);
  }

  const recipient = process.argv[2];

  if (recipient) {
    console.log(`Enviando correo de prueba a ${recipient}...`);

    try {
      const info = await transporter.sendMail({
        from,
        to: recipient,
        subject: "Correo de prueba - UT Game Showcase",
        text: "Este es un correo de prueba de UT Game Showcase comprobando la configuración de Nodemailer.",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="margin-top: 0;">UT Game Showcase</h2>
            <p>Este es un correo de prueba comprobando que la configuración de <strong>Nodemailer</strong> funciona correctamente.</p>
            <p style="color: #666; font-size: 12px;">Enviado el ${new Date().toLocaleString("es-MX")}</p>
          </div>
        `,
      });

      console.log(`✅ Correo de prueba enviado con éxito. Message ID: ${info.messageId}`);
    } catch (error) {
      console.error("❌ Error al enviar el correo de prueba:", error);
      process.exit(1);
    }
  } else {
    console.log("💡 Puedes enviar un correo de prueba especificando un destinatario:");
    console.log("   npm run email:test -- tu-correo@ejemplo.com\n");
  }
}

main().catch((error) => {
  console.error("Error fatal al ejecutar test-email:", error);
  process.exit(1);
});
