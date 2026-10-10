import { Archivo, JetBrains_Mono, Martian_Mono, Syncopate } from "next/font/google";

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

/** Etiquetas, botones y datos. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** Navegación principal. */
const martianMono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-martian-mono",
  display: "swap",
});

export const fontVariables = [syncopate, archivo, jetbrainsMono, martianMono]
  .map((font) => font.variable)
  .join(" ");
