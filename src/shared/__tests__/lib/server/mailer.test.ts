/**
 * @jest-environment node
 */
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
});
