import { readFileSync } from "node:fs";
import path from "node:path";
import manifest from "@app/manifest";

/** Lee ancho y alto de la cabecera IHDR de un PNG de `public/`. */
function readPngSize(src: string) {
  const png = readFileSync(path.join(process.cwd(), "public", src));

  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
}

describe("manifest", () => {
  const result = manifest();

  it("declares the app identity, scope and theme colors", () => {
    expect(result).toMatchObject({
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#000000",
      background_color: "#000000",
    });
  });

  it("includes installable PNG icons, including a maskable one", () => {
    const pngIcons = (result.icons ?? []).filter((icon) => icon.type === "image/png");

    expect(pngIcons.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual([
      "192x192 any",
      "512x512 any",
      "512x512 maskable",
    ]);

    for (const icon of pngIcons) {
      expect(readPngSize(icon.src)).toBe(icon.sizes);
    }
  });

  it("offers shortcuts to the games catalog, the floor plan and the visitor QR", () => {
    expect(result.shortcuts?.map(({ name, url }) => ({ name, url }))).toEqual([
      { name: "Juegos", url: "/games" },
      { name: "Croquis", url: "/floor-plan" },
      { name: "Mi QR", url: "/passport" },
    ]);
  });

  it("ships the apple-touch-icon at 180 px", () => {
    expect(readPngSize("/icons/apple-touch-icon.png")).toBe("180x180");
  });
});
