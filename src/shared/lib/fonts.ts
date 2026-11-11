import { Archivo, JetBrains_Mono, LINE_Seed_JP, Martian_Mono, Syncopate } from "next/font/google";

const syncopate = Syncopate({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-syncopate",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  adjustFontFallback: false,
});

const martianMono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-martian-mono",
  display: "swap",
});

// Only the `.light` theme uses it. Google serves this Japanese family in about 70 slices per weight that next/font
// cannot filter by subset, so preloading it put 202 woff2 files (3.6 MB) on every page; without the preload the
// browser downloads only the slices of the characters it draws, and only where the theme applies.
const lineSeedJp = LINE_Seed_JP({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700", "800"],
  variable: "--font-line-seed-jp",
  display: "swap",
  preload: false,
});

export const fontVariables = [syncopate, archivo, jetbrainsMono, martianMono, lineSeedJp]
  .map((font) => font.variable)
  .join(" ");
