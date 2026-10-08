import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Screaming architecture: un módulo sólo se consume a través de su API
  // pública (`@/modules/<modulo>` o `@/modules/<modulo>/server`).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/*/domain/*",
                "@/modules/*/application/*",
                "@/modules/*/infrastructure/*",
                "@/modules/*/ui/*",
              ],
              message:
                "Importa desde la API pública del módulo: '@/modules/<modulo>' o '@/modules/<modulo>/server'.",
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
    "src/shared/infrastructure/prisma/contract.d.ts",
  ]),
]);

export default eslintConfig;
