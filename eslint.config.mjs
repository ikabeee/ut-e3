import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import sonarjs from "eslint-plugin-sonarjs";

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

// Route Handlers (`route.ts`) y archivos de metadata (`sitemap.ts`, `robots.ts`) no renderizan
// una page: delegan en `lib/` de la feature, pero nunca en componentes ni hooks.
const routeFileImports = {
  group: ["@features/*/hooks/*", "@features/*/components/*"],
  message: "Los Route Handlers y archivos de metadata sólo delegan en `@features/<feature>/lib/*`.",
};

const routeFiles = ["src/app/**/route.ts", "src/app/sitemap.ts", "src/app/robots.ts"];

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
  // Lineamientos de SonarQube (los mismos que reporta SonarLint/SonarCloud).
  sonarjs.configs.recommended,
  // Buenas prácticas de TanStack Query (query keys, queryFn estables, etc.).
  ...tanstackQuery.configs["flat/recommended"],
  { files: ["src/**/*.{ts,tsx,mts}"], rules: restrict() },
  { files: ["src/app/**/*.{ts,tsx}"], ignores: routeFiles, rules: restrict(nonPageImports) },
  { files: routeFiles, rules: restrict(routeFileImports) },
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
    "coverage/**",
    // Artefactos generados por Prisma 8:
    "src/shared/lib/prisma/contract.d.ts",
  ]),
]);

export default eslintConfig;
