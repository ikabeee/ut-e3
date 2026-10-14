import { sendConfirmationEmail } from "@features/auth/lib/server/email-service";
import { sendMail } from "@shared/lib/server/mailer";

jest.mock("@shared/lib/server/mailer", () => ({
  sendMail: jest.fn(),
}));

describe("sendConfirmationEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls sendMail with recipient, confirmation subject, and generated confirmation URL", async () => {
    (sendMail as jest.Mock).mockResolvedValue({ success: true, messageId: "msg-123" });

    const result = await sendConfirmationEmail("lider@example.com", "Mario Bros", "secret-token-abc");

    expect(result).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);

    const callArgs = (sendMail as jest.Mock).mock.calls[0][0];
    expect(callArgs.to).toBe("lider@example.com");
    expect(callArgs.subject).toBe("Confirma tu cuenta - UT Game Showcase");
    expect(callArgs.text).toContain("Mario Bros");
    expect(callArgs.text).toContain("token=secret-token-abc");
    expect(callArgs.html).toContain("Mario Bros");
    expect(callArgs.html).toContain("token=secret-token-abc");
  });

  it("returns false when sendMail fails", async () => {
    (sendMail as jest.Mock).mockResolvedValue({ success: false, error: "SMTP error" });

    const result = await sendConfirmationEmail("lider@example.com", "Mario Bros", "token-fail");

    expect(result).toBe(false);
  });
});
