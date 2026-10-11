import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import sonarjs from "eslint-plugin-sonarjs";

// Reglas de la screaming architecture (ver AGENTS.md, "Reglas de dependencias", y
// docs/architecture.md). Todo import usa los path aliases `@features/*` y `@shared/*`
// (tsconfig.json); no hay archivos barril. `@app/*` sólo existe para que las pruebas de
// `src/app/__tests__/` importen los archivos de ruta.

// ---------------------------------------------------------------------------------------
// Grafo de features
// ---------------------------------------------------------------------------------------

/**
 * Features que puede importar cada feature fuera de `pages/`. Debe ser acíclico: se valida al
 * cargar esta configuración. Las `pages/` pueden componer cualquier feature, porque sólo
 * `src/app` las importa y por eso nunca cierran un ciclo.
 *
 * Una feature nueva empieza sin dependencias; si necesita otra, agrégala aquí y en la tabla
 * de docs/architecture.md.
 */
const FEATURE_DEPENDENCIES = {
  event: [],
  example: [],
  "floor-plan": [],
  games: ["event", "floor-plan"],
  home: ["event", "floor-plan", "games"],
};

const FEATURES = readdirSync(new URL("./src/features", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** Detiene ESLint si el grafo nombra features que no existen o tiene un ciclo. */
function assertValidFeatureGraph(graph) {
  for (const [feature, dependencies] of Object.entries(graph)) {
    for (const name of [feature, ...dependencies]) {
      if (!FEATURES.includes(name)) {
        throw new Error(`FEATURE_DEPENDENCIES nombra la feature "${name}", que no existe en src/features.`);
      }
    }
  }

  const visit = (feature, path) => {
    if (path.includes(feature)) {
      throw new Error(`FEATURE_DEPENDENCIES tiene un ciclo: ${[...path, feature].join(" -> ")}.`);
    }
    for (const dependency of graph[feature] ?? []) {
      visit(dependency, [...path, feature]);
    }
  };
  Object.keys(graph).forEach((feature) => visit(feature, []));
}

assertValidFeatureGraph(FEATURE_DEPENDENCIES);

// ---------------------------------------------------------------------------------------
// Patrones de imports prohibidos
// ---------------------------------------------------------------------------------------

const relativeParentImports = {
  group: ["../*", "../**"],
  message: "Usa los path aliases (`@features/...`, `@shared/...`) en lugar de rutas relativas `../`.",
};

const legacyAlias = {
  group: ["@/*", "@/**"],
  message: "El alias `@/` ya no existe. Usa `@features/...` o `@shared/...`.",
};

const barrelImports = {
  regex: "^@(features|shared)(/[^/]+)*/index$|^@features/[^/]+(/(lib|hooks|components|pages|api)|/lib/server)?$|^@shared/lib/server$",
  message: "No hay archivos barril: importa el archivo concreto, por ejemplo `@features/games/components/game-card`.",
};

// El código de servidor se reconoce por su ubicación, no por su nombre: `lib/server/` de cada
// feature, `@shared/lib/server/` y el cliente de Prisma.
const serverCode = {
  group: ["@features/*/lib/server/**", "@shared/lib/server/**", "@shared/lib/prisma/**"],
  message:
    "Este archivo puede llegar al navegador: no importes código de servidor (`lib/server/`, `@shared/lib/server/` ni Prisma).",
};

const prismaClient = {
  group: ["@shared/lib/prisma/*"],
  message: "Sólo `lib/server/` de una feature consulta la base de datos: usa sus funciones en lugar de `db`.",
};

const hooksLayer = {
  group: ["@features/*/hooks/**"],
  message: "Esta capa no puede usar hooks: `lib/` y `api/` no dependen de React y `pages/` son Server Components.",
};

const componentsLayer = {
  group: ["@features/*/components/**"],
  message: "Esta capa no puede importar componentes: sólo `components/` y `pages/` pintan UI.",
};

const pagesLayer = {
  group: ["@features/*/pages/**"],
  message: "Las pages sólo las importa `src/app` (u otra page que las componga).",
};

const apiLayer = {
  group: ["@features/*/api/**"],
  message: "Esta capa no usa la API HTTP: los datos del servidor se leen con `lib/server/`.",
};

const apiRoutes = {
  group: ["@features/*/api/*-route"],
  message: "Los Route Handlers (`api/*-route.ts`) sólo los importa `src/app/api/**/route.ts`.",
};

const featureImports = {
  group: ["@features/*", "@features/**"],
  message: "`shared` no puede importar de `features`.",
};

const testOnlyImports = {
  group: ["@app/*", "@app/**", "@features/*/__tests__/**", "@shared/__tests__/**"],
  message: "Sólo las pruebas (`__tests__/`) importan `@app/*` y los helpers de prueba.",
};

const nonPageImports = {
  group: ["@features/*/lib/**", "@features/*/hooks/**", "@features/*/components/**", "@features/*/api/**"],
  message: "`src/app` sólo renderiza pages: importa desde `@features/<feature>/pages/<name>-page`.",
};

// Los archivos de metadata (`sitemap.ts`, `robots.ts`, `manifest.ts`) no renderizan una page:
// delegan en `lib/` de la feature, pero nunca en componentes, hooks ni pages.
const metadataFileImports = {
  group: ["@features/*/hooks/**", "@features/*/components/**", "@features/*/pages/**", "@features/*/api/**"],
  message: "Los archivos de metadata sólo delegan en `@features/<feature>/lib/*`.",
};

// Un Route Handler de `src/app` sólo enlaza la ruta con el de la feature, como las pages.
const routeHandlerImports = {
  regex: "^@shared/|^@features/(?![^/]+/api/[^/]+-route$)",
  message: 'Un `route.ts` sólo re-exporta el handler de la feature: `export { GET } from "@features/<feature>/api/<feature>-route";`.',
};

/** Features que `feature` no puede importar según `FEATURE_DEPENDENCIES`. */
function forbiddenFeatures(feature) {
  const allowed = new Set([feature, ...(FEATURE_DEPENDENCIES[feature] ?? [])]);
  return FEATURES.filter((name) => !allowed.has(name)).map((name) => ({
    group: [`@features/${name}/**`],
    message: `\`${feature}\` no depende de \`${name}\` (FEATURE_DEPENDENCIES en eslint.config.mjs). Combínalas en una page o agrega la dependencia sin crear un ciclo.`,
  }));
}

// `server-only` marca un archivo como de servidor: sólo puede vivir en las ubicaciones de servidor.
const serverOnlyPackage = {
  name: "server-only",
  message: 'El código de servidor vive en `lib/server/` (o `api/*-route.ts`): mueve este archivo ahí en lugar de importar "server-only".',
};

const restrict = (patterns, { allowServerOnly = false } = {}) => ({
  "no-restricted-imports": [
    "error",
    {
      paths: allowServerOnly ? [] : [serverOnlyPackage],
      patterns: [relativeParentImports, legacyAlias, barrelImports, ...patterns],
    },
  ],
});

// ---------------------------------------------------------------------------------------
// Capas de una feature
// ---------------------------------------------------------------------------------------

const SOURCE = "{ts,tsx}";

/**
 * `globs` dentro de `dir` y en su `__tests__/`, que repite las subcarpetas del código: una prueba
 * sigue las reglas de la carpeta que prueba (`__tests__/lib/` las de `lib/`).
 */
const withTests = (dir, ...globs) => globs.flatMap((glob) => [`${dir}/${glob}`, `${dir}/__tests__/${glob}`]);

/**
 * Lo que cada carpeta de una feature no puede importar. En ESLint gana el último bloque que
 * coincide con un archivo, por eso `lib/server/` va después de `lib/` y `api/*-route.ts`
 * después de `api/`.
 */
const FEATURE_LAYERS = [
  { glob: `lib/**/*.${SOURCE}`, patterns: [hooksLayer, componentsLayer, pagesLayer, apiRoutes, serverCode] },
  { glob: `lib/server/**/*.${SOURCE}`, patterns: [hooksLayer, componentsLayer, pagesLayer, apiLayer], allowServerOnly: true },
  // Server Actions ("use server"): los componentes cliente las importan y ellas llaman a `lib/server/`.
  { glob: "lib/*-actions.ts", patterns: [hooksLayer, componentsLayer, pagesLayer, apiLayer, prismaClient] },
  { glob: `hooks/**/*.${SOURCE}`, patterns: [componentsLayer, pagesLayer, apiRoutes, serverCode] },
  { glob: `components/**/*.${SOURCE}`, patterns: [pagesLayer, apiRoutes, serverCode] },
  { glob: `pages/**/*.${SOURCE}`, patterns: [hooksLayer, apiLayer, prismaClient], composesFeatures: true },
  { glob: `api/**/*.${SOURCE}`, patterns: [hooksLayer, componentsLayer, pagesLayer, apiRoutes, serverCode] },
  {
    glob: "api/**/*-route{,.test}.ts",
    patterns: [hooksLayer, componentsLayer, pagesLayer, prismaClient],
    allowServerOnly: true,
  },
];

const featureLayerConfigs = FEATURES.flatMap((feature) =>
  FEATURE_LAYERS.map(({ glob, patterns, allowServerOnly, composesFeatures }) => ({
    files: withTests(`src/features/${feature}`, glob),
    rules: restrict([...patterns, ...(composesFeatures ? [] : forbiddenFeatures(feature))], { allowServerOnly }),
  })),
);

const routeHandlerFiles = ["src/app/**/route.ts"];
const metadataFiles = ["src/app/sitemap.ts", "src/app/robots.ts", "src/app/manifest.ts"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Lineamientos de SonarQube (los mismos que reporta SonarLint/SonarCloud).
  sonarjs.configs.recommended,
  // Buenas prácticas de TanStack Query (query keys, queryFn estables, etc.).
  ...tanstackQuery.configs["flat/recommended"],
  { files: [`src/**/*.${SOURCE}`, "src/**/*.mts"], rules: restrict([]) },
  // Ciclos entre archivos (también dentro de una misma feature). No se analizan los paquetes de
  // node_modules: no pueden importar código del proyecto y recorrerlos multiplica el tiempo de lint.
  {
    files: [`src/**/*.${SOURCE}`],
    settings: { "import/ignore": ["node_modules"] },
    rules: { "import/no-cycle": ["error", { ignoreExternal: true }] },
  },
  {
    files: [`src/app/**/*.${SOURCE}`],
    ignores: [...routeHandlerFiles, ...metadataFiles],
    rules: restrict([nonPageImports, prismaClient]),
  },
  { files: routeHandlerFiles, rules: restrict([routeHandlerImports]) },
  { files: metadataFiles, rules: restrict([metadataFileImports, prismaClient]) },
  { files: [`src/shared/**/*.${SOURCE}`, "src/shared/**/*.mts"], rules: restrict([featureImports, prismaClient]) },
  {
    files: withTests("src/shared", `components/**/*.${SOURCE}`, `hooks/**/*.${SOURCE}`),
    rules: restrict([featureImports, serverCode]),
  },
  {
    files: withTests("src/shared", `lib/server/**/*.${SOURCE}`),
    rules: restrict([featureImports, prismaClient], { allowServerOnly: true }),
  },
  {
    files: withTests("src/shared", `lib/prisma/**/*.${SOURCE}`),
    rules: restrict([featureImports], { allowServerOnly: true }),
  },
  ...featureLayerConfigs,
  // Las pruebas pueden importar `@app/*` y los helpers de `__tests__/`; el resto del código no. Es una
  // regla aparte de `no-restricted-imports` para que las pruebas la apaguen sin perder las de su capa.
  {
    files: [`src/**/*.${SOURCE}`, "src/**/*.mts"],
    rules: { "@typescript-eslint/no-restricted-imports": ["error", { patterns: [testOnlyImports] }] },
  },
  { files: [`src/**/__tests__/**/*.${SOURCE}`], rules: { "@typescript-eslint/no-restricted-imports": "off" } },
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
