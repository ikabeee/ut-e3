import {
  buildOgImage,
  buildOpenGraph,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  SITE_OG_IMAGE_PATH,
} from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

describe("buildOpenGraph", () => {
  it("fills the site defaults with the generated image of the site", () => {
    expect(buildOpenGraph()).toMatchObject({
      type: "website",
      siteName: siteConfig.title,
      locale: "es_MX",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.title }],
    });
  });

  it("keeps the defaults it does not override", () => {
    const openGraph = buildOpenGraph({ title: "Ruta 9", images: [{ url: "/games/ruta-9.jpg" }] });

    expect(openGraph).toMatchObject({
      siteName: siteConfig.title,
      title: "Ruta 9",
      images: [{ url: "/games/ruta-9.jpg" }],
    });
  });
});

describe("the Open Graph image", () => {
  it("is a 1200x630 PNG served by the opengraph-image route of the site", () => {
    expect(SITE_OG_IMAGE_PATH).toBe("/opengraph-image");
    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
    expect(OG_IMAGE_CONTENT_TYPE).toBe("image/png");
  });

  it("describes an image of the route with its size and alt text", () => {
    expect(buildOgImage("/games/ruta-9/opengraph-image", "Ruta 9")).toEqual({
      url: "/games/ruta-9/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Ruta 9",
    });
  });
});
