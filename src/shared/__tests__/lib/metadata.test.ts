import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

describe("buildOpenGraph", () => {
  it("fills the site defaults", () => {
    expect(buildOpenGraph()).toMatchObject({
      siteName: siteConfig.title,
      locale: "es_MX",
      images: [{ url: "/media/reel.jpg" }],
    });
  });

  it("keeps the defaults it does not override", () => {
    const openGraph = buildOpenGraph({ title: "Ruta 9", images: [{ url: "/mock/games/ruta-9.jpg" }] });

    expect(openGraph).toMatchObject({ siteName: siteConfig.title, title: "Ruta 9", images: [{ url: "/mock/games/ruta-9.jpg" }] });
  });
});
