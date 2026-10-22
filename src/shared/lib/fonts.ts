import { Archivo, JetBrains_Mono, LINE_Seed_JP, Martian_Mono, Syncopate } from "next/font/google";

// Tipografías del diseño, servidas desde el propio dominio por next/font (sin peticiones a
// Google ni saltos de layout). Cada una expone una variable CSS que usa src/shared/styles/theme.css.

/** Títulos: ancha y en mayúsculas. */
const syncopate = Syncopate({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-syncopate",
  display: "swap",
});

/** Texto corrido. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/**
 * Etiquetas, botones y datos. Sin fuente de respaldo ajustada: las flechas (← → ↗) no vienen
 * en ningún subset de Google y, como en el diseño, deben salir de `ui-monospace`.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  adjustFontFallback: false,
});

/** Navegación principal. */
const martianMono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-martian-mono",
  display: "swap",
});

/** Tipografía única del tema claro (la landing y su cabecera): `theme.css` la pone en lugar de las demás. */
const lineSeedJp = LINE_Seed_JP({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700", "800"],
  variable: "--font-line-seed-jp",
  display: "swap",
});

export const fontVariables = [syncopate, archivo, jetbrainsMono, martianMono, lineSeedJp]
  .map((font) => font.variable)
  .join(" ");
