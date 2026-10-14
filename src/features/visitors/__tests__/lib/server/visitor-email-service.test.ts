/**
 * @jest-environment node
 */
import { sendVisitorQrEmail, sendVisitorRaffleTicketEmail } from "@features/visitors/lib/server/visitor-email-service";

describe("visitor-email-service", () => {
  const mockMailSender = jest.fn();

  beforeEach(() => {
    mockMailSender.mockReset();
  });

  describe("sendVisitorQrEmail", () => {
    it("sends an email with visitor name, QR code SVG, and access links", async () => {
      mockMailSender.mockResolvedValue({ success: true, messageId: "msg-123" });

      const success = await sendVisitorQrEmail(
        "visitor@example.com",
        "Ana García",
        "token1234567890abcdef",
        mockMailSender,
      );

      expect(success).toBe(true);
      expect(mockMailSender).toHaveBeenCalledTimes(1);

      const payload = mockMailSender.mock.calls[0][0];
      expect(payload.to).toBe("visitor@example.com");
      expect(payload.subject).toContain("código de acceso");
      expect(payload.text).toContain("Ana García");
      expect(payload.text).toContain("token1234567890abcdef");
      expect(payload.html).toContain("<svg");
      expect(payload.html).toContain("Ana García");
    });

    it("returns false when mailSender fails", async () => {
      mockMailSender.mockResolvedValue({ success: false, error: "SMTP connection failed" });

      const success = await sendVisitorQrEmail("fail@example.com", "Test Fail", "tokentest", mockMailSender);

      expect(success).toBe(false);
    });
  });

  describe("sendVisitorRaffleTicketEmail", () => {
    it("sends an email with ticket number and congratulations message", async () => {
      mockMailSender.mockResolvedValue({ success: true, messageId: "msg-456" });

      const success = await sendVisitorRaffleTicketEmail("winner@example.com", "Carlos López", 42, mockMailSender);

      expect(success).toBe(true);
      expect(mockMailSender).toHaveBeenCalledTimes(1);

      const payload = mockMailSender.mock.calls[0][0];
      expect(payload.to).toBe("winner@example.com");
      expect(payload.subject).toContain("#42");
      expect(payload.text).toContain("Carlos López");
      expect(payload.text).toContain("#42");
      expect(payload.html).toContain("#42");
      expect(payload.html).toContain("Carlos López");
    });

    it("returns false when sending ticket email fails", async () => {
      mockMailSender.mockResolvedValue({ success: false, error: "Network timeout" });

      const success = await sendVisitorRaffleTicketEmail("fail@example.com", "Fail User", 99, mockMailSender);

      expect(success).toBe(false);
    });
  });
});
