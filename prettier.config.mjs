/**
 * Formato del código con Prettier. Imita el estilo que ya tenía el repositorio para que el
 * reformateo inicial fuera mínimo. Ver "Formato del código" en CONTRIBUTING.md.
 *
 * @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions}
 */
const config = {
  printWidth: 120,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind 4 no tiene tailwind.config.js: el plugin lee el tema desde la hoja que importa Tailwind.
  tailwindStylesheet: "./src/app/globals.css",
  // Ordena también las clases dentro de cn(...).
  tailwindFunctions: ["cn"],
};

export default config;
