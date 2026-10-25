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

const lineSeedJp = LINE_Seed_JP({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700", "800"],
  variable: "--font-line-seed-jp",
  display: "swap",
});

export const fontVariables = [syncopate, archivo, jetbrainsMono, martianMono, lineSeedJp]
  .map((font) => font.variable)
  .join(" ");
