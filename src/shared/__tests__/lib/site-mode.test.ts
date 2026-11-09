import { parseSiteMode } from "@shared/lib/site-mode";

describe("parseSiteMode", () => {
  it("reads the two modes", () => {
    expect(parseSiteMode("landing", "production")).toBe("landing");
    expect(parseSiteMode("full", "production")).toBe("full");
  });

  it("ignores the spaces around the value", () => {
    expect(parseSiteMode(" full ", "production")).toBe("full");
  });

  it("serves only the landing in production when SITE_MODE is not set", () => {
    expect(parseSiteMode(undefined, "production")).toBe("landing");
    expect(parseSiteMode("", "production")).toBe("landing");
  });

  it("serves the whole app outside production when SITE_MODE is not set", () => {
    expect(parseSiteMode(undefined, "development")).toBe("full");
    expect(parseSiteMode(undefined, "test")).toBe("full");
  });

  it("stops on an unknown value instead of guessing", () => {
    expect(() => parseSiteMode("off", "production")).toThrow(
      'SITE_MODE debe ser "landing" o "full". Valor recibido: "off".',
    );
  });
});
