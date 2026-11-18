/**
 * @jest-environment node
 */
import type { AddressInfo } from "node:net";
import { createSmtpSender } from "@shared/lib/server/mailer";

const COMPLETE_ENV = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "465",
  SMTP_USER: "showcase@ut.mx",
  SMTP_PASSWORD: "secret-password",
  SMTP_FROM: "UT Game Showcase <showcase@ut.mx>",
};

const REQUIRED_VARIABLES = Object.keys(COMPLETE_ENV);

describe("createSmtpSender environment validation", () => {
  it.each(REQUIRED_VARIABLES)("throws a Spanish error naming %s when it is missing", (variableName) => {
    const env = Object.fromEntries(Object.entries(COMPLETE_ENV).filter(([name]) => name !== variableName));

    expect(() => createSmtpSender(env)).toThrow(new RegExp(variableName));
  });

  it("throws a Spanish error naming a missing SMTP variable when called with an empty environment", () => {
    expect(() => createSmtpSender({})).toThrow(/SMTP_/);
  });

  it.each(["UT Game Showcase", "UT Game Showcase <>", "UT Game Showcase <showcase>"])(
    "rejects an SMTP_FROM without an email address: %s",
    (from) => {
      expect(() => createSmtpSender({ ...COMPLETE_ENV, SMTP_FROM: from })).toThrow(
        'La variable de entorno SMTP_FROM debe incluir una dirección de correo, por ejemplo "UT Game Showcase <no-reply@tu-dominio.mx>".',
      );
    },
  );

  it.each([
    "UT Game Showcase <info@pixelandcode.click>",
    '"UT Game Showcase" <info@pixelandcode.click>',
    "info@pixelandcode.click",
  ])("accepts an SMTP_FROM with an email address: %s", (from) => {
    expect(() => createSmtpSender({ ...COMPLETE_ENV, SMTP_FROM: from })).not.toThrow();
  });
});

describe("createSmtpSender EHLO greeting", () => {
  it("greets with SMTP_EHLO_NAME", async () => {
    const greeting = await captureGreeting({ SMTP_EHLO_NAME: "pixelandcode.example.com" });

    expect(greeting).toBe("EHLO pixelandcode.example.com");
  });

  it("greets with the host of NEXT_PUBLIC_SITE_URL when SMTP_EHLO_NAME is missing", async () => {
    const greeting = await captureGreeting({ NEXT_PUBLIC_SITE_URL: "https://showcase.example.com" });

    expect(greeting).toBe("EHLO showcase.example.com");
  });
});

async function captureGreeting(extraEnv: Record<string, string>): Promise<string> {
  const { createServer } = await import("node:net");
  let firstLine = "";

  const server = createServer((socket) => {
    socket.write("220 test ESMTP\r\n");
    socket.once("data", (chunk) => {
      firstLine = chunk.toString().split("\r\n")[0];
      socket.end("421 bye\r\n");
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  // SAFETY: a TCP server that is already listening returns an AddressInfo, never a string or null.
  const { port } = server.address() as AddressInfo;
  const send = createSmtpSender({ ...COMPLETE_ENV, SMTP_HOST: "127.0.0.1", SMTP_PORT: String(port), ...extraEnv });

  await send({ to: "a@example.com", subject: "s", text: "t" }).catch(() => undefined);
  await new Promise<void>((resolve) => server.close(() => resolve()));

  return firstLine;
}
