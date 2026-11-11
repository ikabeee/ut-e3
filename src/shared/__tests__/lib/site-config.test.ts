import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

describe("siteConfig", () => {
  it("names the event PIXEL & CODE", () => {
    expect(siteConfig.name).toBe("PIXEL & CODE");
    expect(siteConfig.title).toBe("PIXEL & CODE · Showcase de videojuegos");
  });

  it("describes the showcase of the division with the Juega, califica y gana wording and a single raffle", () => {
    expect(siteConfig.description).toContain("PIXEL & CODE");
    expect(siteConfig.description).toContain("División de Ingeniería y Tecnologías");
    expect(siteConfig.description).toContain("Juega, califica y gana");
    expect(siteConfig.description).not.toMatch(/sorteos/i);
  });

  it("publishes the new title as the Open Graph site name", () => {
    expect(buildOpenGraph().siteName).toBe("PIXEL & CODE · Showcase de videojuegos");
  });
});
