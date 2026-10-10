import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextJest from "next/jest.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// next/jest compila con SWC; simula CSS, imágenes, next/font y `server-only`;
// y carga next.config.ts y .env.
const createJestConfig = nextJest({ dir: rootDir });

/**
 * Traduce los path aliases de tsconfig.json (`@features/*`, `@shared/*`) a
 * `moduleNameMapper`, para que los aliases se declaren en un único lugar.
 */
function aliasesFromTsconfig() {
  const tsconfig = JSON.parse(readFileSync(path.join(rootDir, "tsconfig.json"), "utf8"));
  const paths = tsconfig.compilerOptions?.paths ?? {};

  return Object.fromEntries(
    Object.entries(paths).map(([alias, [target]]) => [
      `^${alias.replace("/*", "/(.*)")}$`,
      `<rootDir>/${target.replace("./", "").replace("/*", "/$1")}`,
    ]),
  );
}

/** @type {import("jest").Config} */
const config = {
  rootDir,
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: aliasesFromTsconfig(),
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/shared/lib/prisma/**"],
  coverageReporters: ["text-summary", "lcov"],
};

// Paquetes que sólo se publican como ESM y Jest debe transformar.
const esmPackages = ["@heroui", "tailwind-variants", "tailwind-merge"].join("|");

// next/jest siempre agrega `/node_modules/` a `transformIgnorePatterns`, así que se reemplaza
// ese patrón después de construir la configuración.
export default async function jestConfig() {
  const nextConfig = await createJestConfig(config)();

  return {
    ...nextConfig,
    transformIgnorePatterns: [
      `/node_modules/(?!(${esmPackages})/)`,
      ...nextConfig.transformIgnorePatterns.filter((pattern) => !pattern.startsWith("/node_modules")),
    ],
  };
}
