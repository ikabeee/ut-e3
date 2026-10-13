// Genera los íconos PNG de la PWA a partir de src/app/icon.svg.
// Uso: npm run pwa:icons (vuelve a correrlo cada vez que cambies icon.svg).
// `sharp` llega como dependencia de Next.js, así que no se agrega a package.json.
import { mkdir, readFile } from "node:fs/promises";
import sharp from "sharp";

const sourceUrl = new URL("../src/app/icon.svg", import.meta.url);

const outputUrl = new URL("../public/icons/", import.meta.url);

// Mismo color que `siteConfig.themeColor` (src/shared/lib/site-config.ts) y `--utg-black`.
const BACKGROUND_COLOR = "#000000";

// Zona segura de los íconos maskable: el sistema puede recortar todo fuera del 80 % central.
const MASKABLE_SAFE_ZONE = 0.8;

// Densidad alta para que el SVG (viewBox de 18 px) se rasterice nítido a 512 px.
const SVG_DENSITY = 2400;

const svg = await readFile(sourceUrl);

/** Rasteriza el SVG completo a un PNG cuadrado de `size` px. */
function renderIcon(size) {
  return sharp(svg, { density: SVG_DENSITY }).resize(size, size).png();
}

/** Centra el logo en el 80 % del lienzo sobre el color de fondo del tema. */
async function renderMaskableIcon(size) {
  const logoSize = Math.round(size * MASKABLE_SAFE_ZONE);
  const logo = await renderIcon(logoSize).toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND_COLOR },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png();
}

const icons = [
  { file: "icon-192.png", image: renderIcon(192) },
  { file: "icon-512.png", image: renderIcon(512) },
  { file: "icon-maskable-512.png", image: await renderMaskableIcon(512) },
  // iOS no lee el manifest: usa este ícono (180 px) al agregar el sitio a la pantalla de inicio.
  { file: "apple-touch-icon.png", image: renderIcon(180) },
];

await mkdir(outputUrl, { recursive: true });

for (const { file, image } of icons) {
  const { width, height } = await image.toFile(new URL(file, outputUrl).pathname);
  console.log(`public/icons/${file} (${width}x${height})`);
}
