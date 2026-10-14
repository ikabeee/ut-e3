import nodemailer from "nodemailer";
import {
  createMailerTransporter,
  getMailerTransporter,
  resetMailerTransporter,
  sendMail,
  verifyMailerConnection,
} from "@shared/lib/server/mailer";
import { env, type SmtpConfig } from "@shared/lib/env";

jest.mock("nodemailer");

describe("mailer", () => {
  const mockConfig: SmtpConfig = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    user: "usuario",
    password: "password123",
    from: "Test <test@example.com>",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetMailerTransporter();
  });

  describe("createMailerTransporter", () => {
    it("creates a nodemailer transporter with correct config", () => {
      const mockTransporter = { verify: jest.fn(), sendMail: jest.fn() };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

      const transporter = createMailerTransporter(mockConfig);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          user: "usuario",
          pass: "password123",
        },
      });
      expect(transporter).toBe(mockTransporter);
    });
  });

  describe("getMailerTransporter and resetMailerTransporter", () => {
    it("returns null when env.smtp is not configured", () => {
      const originalSmtp = env.smtp;
      env.smtp = null;

      try {
        expect(getMailerTransporter()).toBeNull();
      } finally {
        env.smtp = originalSmtp;
      }
    });

    it("returns and caches transporter when env.smtp is configured", () => {
      const originalSmtp = env.smtp;
      const mockTransporter = { verify: jest.fn(), sendMail: jest.fn() };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

      env.smtp = mockConfig;

      try {
        const t1 = getMailerTransporter();
        const t2 = getMailerTransporter();

        expect(t1).toBe(mockTransporter);
        expect(t2).toBe(mockTransporter);
        expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);

        resetMailerTransporter();
        const t3 = getMailerTransporter();
        expect(t3).toBe(mockTransporter);
        expect(nodemailer.createTransport).toHaveBeenCalledTimes(2);
      } finally {
        env.smtp = originalSmtp;
      }
    });
  });

  describe("verifyMailerConnection", () => {
    it("returns error if no transporter is available", async () => {
      const originalSmtp = env.smtp;
      env.smtp = null;

      try {
        const result = await verifyMailerConnection();
        expect(result.success).toBe(false);
        expect(result.error).toContain("No hay configuración SMTP disponible");
      } finally {
        env.smtp = originalSmtp;
      }
    });

    it("returns success if transporter verify resolves", async () => {
      const originalSmtp = env.smtp;
      const mockVerify = jest.fn().mockResolvedValue(true);
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        verify: mockVerify,
      });

      env.smtp = mockConfig;

      try {
        const result = await verifyMailerConnection();
        expect(result.success).toBe(true);
        expect(mockVerify).toHaveBeenCalled();
      } finally {
        env.smtp = originalSmtp;
      }
    });

    it("returns error message if transporter verify fails", async () => {
      const originalSmtp = env.smtp;
      const mockVerify = jest.fn().mockRejectedValue(new Error("Connection refused"));
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        verify: mockVerify,
      });

      env.smtp = mockConfig;

      try {
        const result = await verifyMailerConnection();
        expect(result.success).toBe(false);
        expect(result.error).toBe("Connection refused");
      } finally {
        env.smtp = originalSmtp;
      }
    });
  });

  describe("sendMail", () => {
    it("prints dev preview and succeeds when no transporter configured", async () => {
      const originalSmtp = env.smtp;
      env.smtp = null;
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      try {
        const result = await sendMail({
          to: "destinatario@example.com",
          subject: "Asunto de prueba",
          html: "<p>Hola</p>",
          text: "Hola",
        });

        expect(result.success).toBe(true);
        expect(result.messageId).toMatch(/^dev-/);
        expect(consoleSpy).toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
        env.smtp = originalSmtp;
      }
    });

    it("sends email with transporter when configured", async () => {
      const originalSmtp = env.smtp;
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: "msg-12345" });
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: mockSendMail,
      });

      env.smtp = mockConfig;

      try {
        const result = await sendMail({
          to: ["dest1@example.com", "dest2@example.com"],
          subject: "Bienvenido",
          html: "<p>Hola a todos</p>",
          text: "Hola a todos",
          replyTo: "support@example.com",
        });

        expect(result.success).toBe(true);
        expect(result.messageId).toBe("msg-12345");
        expect(mockSendMail).toHaveBeenCalledWith({
          from: "Test <test@example.com>",
          to: "dest1@example.com, dest2@example.com",
          subject: "Bienvenido",
          html: "<p>Hola a todos</p>",
          text: "Hola a todos",
          replyTo: "support@example.com",
        });
      } finally {
        env.smtp = originalSmtp;
      }
    });

    it("catches errors from transporter.sendMail and returns failure result", async () => {
      const originalSmtp = env.smtp;
      const mockSendMail = jest.fn().mockRejectedValue(new Error("SMTP timeout"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (nodemailer.createTransport as jest.Mock).mockReturnValue({
        sendMail: mockSendMail,
      });

      env.smtp = mockConfig;

      try {
        const result = await sendMail({
          to: "dest@example.com",
          subject: "Fallo",
          html: "<p>Fallo</p>",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("SMTP timeout");
      } finally {
        consoleErrorSpy.mockRestore();
        env.smtp = originalSmtp;
      }
    });
  });
});
