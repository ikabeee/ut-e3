import {
  DEFAULT_EMAIL_FROM,
  DEVELOPMENT_SITE_URL,
  parseAdminCredentials,
  parseEmailFrom,
  parseEnv,
  parseSiteUrl,
  parseSmtpConfig,
} from "@shared/lib/env";

describe("parseSiteUrl", () => {
  it("accepts an absolute http(s) URL", () => {
    expect(parseSiteUrl("https://utg.example.com", "production")).toBe("https://utg.example.com");
    expect(parseSiteUrl("http://localhost:4000", "development")).toBe("http://localhost:4000");
  });

  it("trims surrounding whitespace", () => {
    expect(parseSiteUrl("  https://utg.example.com  ", "production")).toBe("https://utg.example.com");
  });

  it("rejects a trailing slash", () => {
    expect(() => parseSiteUrl("https://utg.example.com/", "production")).toThrow('no debe terminar en "/"');
  });

  it("rejects a relative URL", () => {
    expect(() => parseSiteUrl("/games", "production")).toThrow("URL absoluta http(s)");
    expect(() => parseSiteUrl("utg.example.com", "development")).toThrow("URL absoluta http(s)");
  });

  it("rejects a non-http protocol", () => {
    expect(() => parseSiteUrl("ftp://utg.example.com", "production")).toThrow("URL absoluta http(s)");
  });

  it("fails in production when the variable is missing", () => {
    expect(() => parseSiteUrl(undefined, "production")).toThrow("Falta NEXT_PUBLIC_SITE_URL");
    expect(() => parseSiteUrl("", "production")).toThrow("Falta NEXT_PUBLIC_SITE_URL");
  });

  it("falls back to localhost in development and tests", () => {
    expect(parseSiteUrl(undefined, "development")).toBe(DEVELOPMENT_SITE_URL);
    expect(parseSiteUrl(undefined, "test")).toBe(DEVELOPMENT_SITE_URL);
    expect(DEVELOPMENT_SITE_URL).toBe("http://localhost:3000");
  });
});

describe("parseAdminCredentials", () => {
  it("needs both the user and the password", () => {
    expect(parseAdminCredentials("staff", "secreto")).toEqual({ user: "staff", password: "secreto" });
    expect(parseAdminCredentials("staff", "")).toBeNull();
    expect(parseAdminCredentials(undefined, "secreto")).toBeNull();
  });
});

describe("parseEmailFrom", () => {
  it("returns default email from when value is undefined or empty", () => {
    expect(parseEmailFrom(undefined)).toBe(DEFAULT_EMAIL_FROM);
    expect(parseEmailFrom("")).toBe(DEFAULT_EMAIL_FROM);
    expect(parseEmailFrom("   ")).toBe(DEFAULT_EMAIL_FROM);
  });

  it("trims and returns custom email from", () => {
    expect(parseEmailFrom("  showcase@ute3.edu.mx  ")).toBe("showcase@ute3.edu.mx");
  });
});

describe("parseSmtpConfig", () => {
  it("returns null when host, user or password are missing", () => {
    expect(parseSmtpConfig({})).toBeNull();
    expect(parseSmtpConfig({ SMTP_HOST: "smtp.example.com" })).toBeNull();
    expect(parseSmtpConfig({ SMTP_HOST: "smtp.example.com", SMTP_USER: "user" })).toBeNull();
    expect(parseSmtpConfig({ SMTP_USER: "user", SMTP_PASSWORD: "secret" })).toBeNull();
  });

  it("parses valid smtp config with default port 587 and secure false", () => {
    expect(
      parseSmtpConfig({
        SMTP_HOST: "smtp.example.com",
        SMTP_USER: "user@example.com",
        SMTP_PASSWORD: "secret",
      }),
    ).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "user@example.com",
      password: "secret",
      from: DEFAULT_EMAIL_FROM,
    });
  });

  it("infers secure true when port is 465 and SMTP_SECURE is not set", () => {
    expect(
      parseSmtpConfig({
        SMTP_HOST: "smtp.gmail.com",
        SMTP_PORT: "465",
        SMTP_USER: "user@gmail.com",
        SMTP_PASSWORD: "secret",
      }),
    ).toEqual({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      user: "user@gmail.com",
      password: "secret",
      from: DEFAULT_EMAIL_FROM,
    });
  });

  it("respects explicit SMTP_SECURE flag", () => {
    expect(
      parseSmtpConfig({
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SMTP_SECURE: "true",
        SMTP_USER: "user",
        SMTP_PASSWORD: "secret",
        EMAIL_FROM: "test@example.com",
      }),
    ).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: true,
      user: "user",
      password: "secret",
      from: "test@example.com",
    });
  });

  it("throws error when port is not a valid positive number", () => {
    expect(() =>
      parseSmtpConfig({
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "invalid",
        SMTP_USER: "user",
        SMTP_PASSWORD: "secret",
      }),
    ).toThrow("SMTP_PORT debe ser un número de puerto válido");

    expect(() =>
      parseSmtpConfig({
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "0",
        SMTP_USER: "user",
        SMTP_PASSWORD: "secret",
      }),
    ).toThrow("SMTP_PORT debe ser un número de puerto válido");
  });
});

describe("parseEnv", () => {
  it("maps the raw variables to the validated env", () => {
    expect(
      parseEnv({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://utg.example.com",
        IMAGE_REMOTE_HOSTS: "img.itch.zone",
        ADMIN_USER: "staff",
        ADMIN_PASSWORD: "secreto",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "587",
        SMTP_USER: "sender@example.com",
        SMTP_PASSWORD: "secret-password",
        EMAIL_FROM: "Showcase <showcase@ute3.edu.mx>",
      }),
    ).toEqual({
      siteUrl: "https://utg.example.com",
      imageRemoteHosts: ["img.itch.zone"],
      admin: { user: "staff", password: "secreto" },
      smtp: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        user: "sender@example.com",
        password: "secret-password",
        from: "Showcase <showcase@ute3.edu.mx>",
      },
      emailFrom: "Showcase <showcase@ute3.edu.mx>",
    });
  });
});

