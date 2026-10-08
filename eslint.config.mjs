import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Import rules for the screaming architecture. Every import uses the path
// aliases `@features/*` and `@shared/*` (see tsconfig.json); there are no barrel files.
const relativeParentImports = {
  group: ["../*", "../**"],
  message: "Usa los path aliases (`@features/...`, `@shared/...`) en lugar de rutas relativas `../`.",
};

const legacyAlias = {
  group: ["@/*", "@/**"],
  message: "El alias `@/` ya no existe. Usa `@features/...` o `@shared/...`.",
};

const barrelImports = {
  regex: "^@(features|shared)(/[^/]+)*/index$|^@features/[^/]+(/(lib|hooks|components|pages))?$",
  message: "No hay archivos barril: importa el archivo concreto, por ejemplo `@features/games/components/game-card`.",
};

const serverOnlyImports = {
  group: ["@features/*/lib/*-queries", "@features/*/lib/*-actions", "@shared/lib/prisma/*"],
  message: "Los componentes y hooks no pueden importar código de servidor (consultas, acciones ni Prisma).",
};

const nonPageImports = {
  group: ["@features/*/lib/*", "@features/*/hooks/*", "@features/*/components/*"],
  message: "`src/app` sólo renderiza pages: importa desde `@features/<feature>/pages/<name>-page`.",
};

const featureImports = {
  group: ["@features/*", "@features/**"],
  message: "`shared` no puede importar de `features`.",
};

const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns: [relativeParentImports, legacyAlias, barrelImports, ...patterns] }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ["src/**/*.{ts,tsx,mts}"], rules: restrict() },
  { files: ["src/app/**/*.{ts,tsx}"], rules: restrict(nonPageImports) },
  {
    files: ["src/features/*/components/**/*.{ts,tsx}", "src/features/*/hooks/**/*.{ts,tsx}"],
    rules: restrict(serverOnlyImports),
  },
  { files: ["src/shared/**/*.{ts,tsx,mts}"], rules: restrict(featureImports) },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefactos generados por Prisma 8:
    "src/shared/lib/prisma/contract.d.ts",
  ]),
]);

export default eslintConfig;
