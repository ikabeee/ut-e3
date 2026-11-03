import { existsSync } from "node:fs";
import path from "node:path";
import { buildManifest } from "@features/pwa/lib/pwa-manifest";
import { siteConfig } from "@shared/lib/site-config";

describe("buildManifest (RNF-14)", () => {
  const manifest = buildManifest();

  it("installs as a standalone app that opens on the passport", () => {
    expect(manifest).toMatchObject({ start_url: "/passport", scope: "/", display: "standalone", lang: "es" });
  });

  it("takes the name and the colors of the site, which are those of the design system", () => {
    expect(manifest).toMatchObject({
      name: siteConfig.name,
      short_name: siteConfig.name,
      theme_color: siteConfig.themeColor,
      background_color: siteConfig.backgroundColor,
    });
  });

  it("has the icons of 192 and 512 px and a maskable one, and the files exist", () => {
    const icons = manifest.icons ?? [];

    expect(icons.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual([
      "192x192 any",
      "512x512 any",
      "512x512 maskable",
    ]);

    for (const icon of icons) {
      expect(existsSync(path.join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });
});
