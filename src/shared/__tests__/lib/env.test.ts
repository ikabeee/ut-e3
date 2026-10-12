import { DEVELOPMENT_SITE_URL, parseAdminCredentials, parseDataSource, parseEnv, parseSiteUrl } from "@shared/lib/env";

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

describe("parseDataSource", () => {
  it("uses the mocks when the variable is missing", () => {
    expect(parseDataSource(undefined)).toBe("mock");
    expect(parseDataSource("  ")).toBe("mock");
  });

  it("accepts the known data sources", () => {
    expect(parseDataSource("prisma")).toBe("prisma");
    expect(parseDataSource(" mock ")).toBe("mock");
  });

  it("rejects an unknown data source", () => {
    expect(() => parseDataSource("mysql")).toThrow('DATA_SOURCE debe ser "mock" o "prisma"');
  });
});

describe("parseAdminCredentials", () => {
  it("needs both the user and the password", () => {
    expect(parseAdminCredentials("staff", "secreto")).toEqual({ user: "staff", password: "secreto" });
    expect(parseAdminCredentials("staff", "")).toBeNull();
    expect(parseAdminCredentials(undefined, "secreto")).toBeNull();
  });
});

describe("parseEnv", () => {
  it("maps the raw variables to the validated env", () => {
    expect(
      parseEnv({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://utg.example.com",
        DATA_SOURCE: "prisma",
        IMAGE_REMOTE_HOSTS: "img.itch.zone",
        ADMIN_USER: "staff",
        ADMIN_PASSWORD: "secreto",
      }),
    ).toEqual({
      siteUrl: "https://utg.example.com",
      dataSource: "prisma",
      imageRemoteHosts: ["img.itch.zone"],
      admin: { user: "staff", password: "secreto" },
    });
  });
});
