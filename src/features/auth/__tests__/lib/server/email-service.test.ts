import { sendConfirmationEmail } from "@features/auth/lib/server/email-service";
import type { SendMailOptions, SendMailResult } from "@shared/lib/server/mailer";

describe("sendConfirmationEmail", () => {
  it("calls sendMail with recipient, confirmation subject, and generated confirmation URL", async () => {
    const mockSendMail = jest.fn<Promise<SendMailResult>, [SendMailOptions]>(async () => {
      return { success: true, messageId: "msg-123" };
    });

    const result = await sendConfirmationEmail("lider@example.com", "Mario Bros", "secret-token-abc", mockSendMail);

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);

    const callArgs = mockSendMail.mock.calls[0]?.[0];

    expect(callArgs?.to).toBe("lider@example.com");
    expect(callArgs?.subject).toBe("Activa tu cuenta y establece tu contraseña - UT Game Showcase");
    expect(callArgs?.text).toContain("Mario Bros");
    expect(callArgs?.text).toContain("token=secret-token-abc");
    expect(callArgs?.html).toContain("Mario Bros");
    expect(callArgs?.html).toContain("token=secret-token-abc");
  });

  it("returns false when sendMail fails", async () => {
    const mockSendMail = jest.fn<Promise<SendMailResult>, [SendMailOptions]>(async () => {
      return { success: false, error: "SMTP error" };
    });

    const result = await sendConfirmationEmail("lider@example.com", "Mario Bros", "token-fail", mockSendMail);

    expect(result).toBe(false);
  });
});
