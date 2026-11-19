/**
 * @jest-environment node
 */
import type { AddressInfo } from "node:net";
import { buildSmtpTransportOptions, createSmtpSender } from "@shared/lib/server/mailer";

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

describe("createSmtpSender connection reuse and pace", () => {
  it("reuses one pooled connection and sends one message every 2 seconds at most", () => {
    const options = buildSmtpTransportOptions(COMPLETE_ENV);

    expect(options).toMatchObject({ pool: true, maxConnections: 1, rateDelta: 2000, rateLimit: 1 });
  });

  it("recycles the connection after 100 messages instead of keeping it open for ever", () => {
    expect(buildSmtpTransportOptions(COMPLETE_ENV)).toMatchObject({ maxMessages: 100 });
  });

  it("answers the same sender for the same configuration, so every delivery shares the connection", () => {
    const env = { ...COMPLETE_ENV, SMTP_HOST: "shared.example.com" };

    expect(createSmtpSender(env)).toBe(createSmtpSender({ ...env }));
  });

  it("answers another sender for another configuration", () => {
    const first = createSmtpSender({ ...COMPLETE_ENV, SMTP_HOST: "first.example.com" });
    const second = createSmtpSender({ ...COMPLETE_ENV, SMTP_HOST: "second.example.com" });

    expect(first).not.toBe(second);
  });
});

describe("createSmtpSender EHLO name", () => {
  it("announces the domain of the site when the environment has no site URL, never the hostname of the container", () => {
    const options = buildSmtpTransportOptions(COMPLETE_ENV, "https://showcase.example.com");

    expect(options.name).toBe("showcase.example.com");
  });

  it("does not announce localhost of a development build", () => {
    expect(buildSmtpTransportOptions(COMPLETE_ENV, "http://localhost:3000").name).toBeUndefined();
  });

  it("prefers SMTP_EHLO_NAME, then the NEXT_PUBLIC_SITE_URL of the environment, over the site of the build", () => {
    const fromBuild = "https://build.example.com";

    expect(buildSmtpTransportOptions({ ...COMPLETE_ENV, SMTP_EHLO_NAME: "mail.example.com" }, fromBuild).name).toBe(
      "mail.example.com",
    );
    expect(
      buildSmtpTransportOptions({ ...COMPLETE_ENV, NEXT_PUBLIC_SITE_URL: "https://runtime.example.com" }, fromBuild)
        .name,
    ).toBe("runtime.example.com");
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
