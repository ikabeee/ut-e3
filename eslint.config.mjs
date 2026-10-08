import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Screaming architecture: a feature is consumed only through its public API:
  // `@/features/<feature>` (client-safe) or `@/features/<feature>/pages` (routes).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/*/lib",
                "@/features/*/lib/*",
                "@/features/*/hooks",
                "@/features/*/hooks/*",
                "@/features/*/components",
                "@/features/*/components/*",
                "@/features/*/pages/*",
              ],
              message:
                "Importa desde la API pública de la feature: '@/features/<feature>' o '@/features/<feature>/pages'.",
            },
          ],
        },
      ],
    },
  },
  // `shared` must not depend on features, and `src/app` only renders feature pages.
  {
    files: ["src/shared/**/*.{ts,tsx,mts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features", "@/features/*", "@/features/**"],
              message: "`shared` no puede importar de `features`.",
            },
          ],
        },
      ],
    },
  },
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
