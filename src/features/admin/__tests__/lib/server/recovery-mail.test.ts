/**
 * @jest-environment node
 */
import { sendSmtpTest } from "@features/admin/lib/server/mail-recovery";
import type { OutgoingEmail } from "@shared/lib/server/email-outbox";

describe("sendSmtpTest", () => {
  it("sends one email to the given address with a direct send and answers null", async () => {
    const sent: OutgoingEmail[] = [];

    await expect(sendSmtpTest("sysadmin@ut.mx", async (email) => void sent.push(email))).resolves.toBeNull();

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "sysadmin@ut.mx", subject: expect.stringContaining("Prueba de SMTP") });
  });

  it("answers the exact message of the error instead of throwing", async () => {
    const failing = async () => {
      throw new Error("535 5.7.8 Username and Password not accepted");
    };

    await expect(sendSmtpTest("sysadmin@ut.mx", failing)).resolves.toBe("535 5.7.8 Username and Password not accepted");
  });
});
