/**
 * @jest-environment node
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import {
  buildOgCardElement,
  buildSiteOgCard,
  getOgTitleFontSize,
  OG_IMAGE_OPTIONS,
  renderOgImage,
} from "@shared/lib/og-image";
import { siteConfig } from "@shared/lib/site-config";

// Jest cannot run the renderer of next/og (it is loaded with a dynamic import() that needs --experimental-vm-modules),
// so these tests check the card and the response; that the image is drawn is checked by `next build`, which
// prerenders /opengraph-image.

interface Box {
  style?: { display?: string; background?: string };
  children?: ReactNode;
}

function collectBoxes(node: ReactNode): ReactElement<Box>[] {
  if (!isValidElement<Box>(node)) return [];

  return [node, ...Children.toArray(node.props.children).flatMap(collectBoxes)];
}

function collectTexts(node: ReactNode): string[] {
  if (!isValidElement<Box>(node)) return [String(node)];

  return Children.toArray(node.props.children).flatMap(collectTexts);
}

describe("buildSiteOgCard", () => {
  it("names the site and the organization from their owner and keeps the details it receives", () => {
    expect(buildSiteOgCard(["20.11.2026"])).toEqual({
      eyebrow: siteConfig.organizationLabel,
      title: siteConfig.title,
      details: ["20.11.2026"],
      footer: new URL(siteConfig.url).host,
    });
  });
});

describe("getOgTitleFontSize", () => {
  it("shrinks the title as it gets longer so that it keeps fitting", () => {
    const sizes = ["Ruta 9", "Sombra del Mictlán y los hijos", siteConfig.title, "x".repeat(70)].map(
      getOgTitleFontSize,
    );

    expect(sizes).toEqual([...sizes].sort((first, second) => second - first));
    expect(new Set(sizes).size).toBe(4);
  });
});

describe("buildOgCardElement", () => {
  const card = { eyebrow: "UT Cancún", title: "Ruta 9", details: ["Acción", "ZA-S1"], footer: "ejemplo.com" };

  it("writes the eyebrow, the title, every detail and the footer on a black background", () => {
    const element = buildOgCardElement(card);

    expect(collectTexts(element)).toEqual(["UT Cancún", "Ruta 9", "Acción", "ZA-S1", "ejemplo.com"]);
    expect(collectBoxes(element)[0].props.style?.background).toBe(siteConfig.backgroundColor);
  });

  it("makes every box a flexbox, the only layout that the image renderer draws", () => {
    const boxes = collectBoxes(buildOgCardElement(card));

    expect(boxes.length).toBeGreaterThan(5);
    expect(boxes.filter((box) => box.props.style?.display !== "flex")).toEqual([]);
  });

  it("shortens a title that is far too long instead of letting it leave the card", () => {
    const [, title] = collectTexts(buildOgCardElement({ ...card, title: "Muy largo ".repeat(40) }));

    expect(title.length).toBeLessThanOrEqual(90);
    expect(title.endsWith("…")).toBe(true);
  });

  it("draws a card with no details", () => {
    expect(collectTexts(buildOgCardElement({ ...card, details: [] }))).toEqual(["UT Cancún", "Ruta 9", "ejemplo.com"]);
  });
});

describe("renderOgImage", () => {
  it("answers a PNG that can be cached for a while but not forever, with the size of the Open Graph image", () => {
    const response = renderOgImage(buildSiteOgCard(["20.11.2026"]));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, stale-while-revalidate=86400");
    expect(OG_IMAGE_OPTIONS).toMatchObject({ width: 1200, height: 630 });
  });
});
