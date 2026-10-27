import { readdirSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const FEATURE_DEPENDENCIES = {
  landing: [],
  "floor-plan": ["games"],
  schedule: ["accounts", "floor-plan"],
  visitors: [],
};

const FEATURES = readdirSync(new URL("./src/features", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

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

const relativeParentImports = {
  group: ["../*", "../**"],
  message: "Usa los path aliases (`@features/...`, `@shared/...`) en lugar de rutas relativas `../`.",
};

const legacyAlias = {
  group: ["@/*", "@/**"],
  message: "El alias `@/` ya no existe. Usa `@features/...` o `@shared/...`.",
};

const barrelImports = {
  regex:
    "^@(features|shared)(/[^/]+)*/index$|^@features/[^/]+(/(lib|hooks|components|pages|api)|/lib/server)?$|^@shared/lib/server$",
  message: "No hay archivos barril: importa el archivo concreto, por ejemplo `@features/games/components/game-card`.",
};

const prismaModules = ["@generated/prisma/**", "@prisma/client", "@prisma/client/**", "@prisma/adapter-better-sqlite3"];

const serverCode = {
  group: ["@features/*/lib/server/**", "@shared/lib/server/**", ...prismaModules],
  message:
    "Este archivo puede llegar al navegador: no importes código de servidor (`lib/server/`, `@shared/lib/server/` ni Prisma).",
};

const prismaClient = {
  group: prismaModules,
  message:
    "Sólo `lib/server/` de una feature y `@shared/lib/server/` usan el cliente de Prisma (`@generated/prisma/*`): llama a sus funciones.",
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
  group: [
    "@features/*/lib/**",
    "@features/*/hooks/**",
    "@features/*/components/**",
    "@features/*/api/**",
    "@shared/components/**",
  ],
  message:
    "`src/app` sólo renderiza pages: importa desde `@features/<feature>/pages/<name>-page` (la navegación, el pie, el 404 y el error viven en la feature `site`).",
};

const rootLayoutImports = {
  regex:
    "^@features/(?!site/components/|offline/components/offline-notices$)[^/]+/(lib|hooks|components|api)/|^@shared/components/(?!query-provider$)",
  message:
    "El layout sólo monta `@features/site/components/*`, `OfflineNotices`, `QueryProvider` y estilos globales; el resto va en una page.",
};

const metadataFileImports = {
  group: ["@features/*/hooks/**", "@features/*/components/**", "@features/*/pages/**", "@features/*/api/**"],
  message: "Los archivos de metadata sólo delegan en `@features/<feature>/lib/*`.",
};

const routeHandlerImports = {
  regex: "^@shared/|^@features/(?![^/]+/api/[^/]+-route$)",
  message:
    'Un `route.ts` sólo re-exporta el handler de la feature: `export { GET } from "@features/<feature>/api/<feature>-route";`.',
};

function forbiddenFeatures(feature) {
  const allowed = new Set([feature, ...(FEATURE_DEPENDENCIES[feature] ?? [])]);

  return FEATURES.filter((name) => !allowed.has(name)).map((name) => ({
    group: [`@features/${name}/**`],
    message: `\`${feature}\` no depende de \`${name}\` (FEATURE_DEPENDENCIES en eslint.config.mjs). Combínalas en una page o agrega la dependencia sin crear un ciclo.`,
  }));
}

const serverOnlyPackage = {
  name: "server-only",
  message:
    'El código de servidor vive en `lib/server/` (o `api/*-route.ts`): mueve este archivo ahí en lugar de importar "server-only".',
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

const SOURCE = "{ts,tsx}";

const withTests = (dir, ...globs) => globs.flatMap((glob) => [`${dir}/${glob}`, `${dir}/__tests__/${glob}`]);

const FEATURE_LAYERS = [
  { glob: `lib/**/*.${SOURCE}`, patterns: [hooksLayer, componentsLayer, pagesLayer, apiRoutes, serverCode] },
  {
    glob: `lib/server/**/*.${SOURCE}`,
    patterns: [hooksLayer, componentsLayer, pagesLayer, apiLayer],
    allowServerOnly: true,
  },
  { glob: "lib/*-actions{,.test}.ts", patterns: [hooksLayer, componentsLayer, pagesLayer, apiLayer, prismaClient] },
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
  sonarjs.configs.recommended,
  { rules: { "sonarjs/no-commented-code": "error" } },
  { files: [`src/**/*.${SOURCE}`, "src/**/*.mts"], rules: restrict([]) },
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
  { files: ["src/app/layout.tsx"], rules: restrict([rootLayoutImports, prismaClient]) },
  { files: routeHandlerFiles, rules: restrict([routeHandlerImports, prismaClient]) },
  { files: metadataFiles, rules: restrict([metadataFileImports, prismaClient]) },
  { files: [`src/shared/**/*.${SOURCE}`, "src/shared/**/*.mts"], rules: restrict([featureImports, prismaClient]) },
  {
    files: withTests("src/shared", `components/**/*.${SOURCE}`, `hooks/**/*.${SOURCE}`),
    rules: restrict([featureImports, serverCode]),
  },
  {
    files: withTests("src/shared", `lib/server/**/*.${SOURCE}`),
    rules: restrict([featureImports], { allowServerOnly: true }),
  },
  ...featureLayerConfigs,
  {
    files: [`src/**/*.${SOURCE}`, "src/**/*.mts"],
    rules: { "@typescript-eslint/no-restricted-imports": ["error", { patterns: [testOnlyImports] }] },
  },
  { files: [`src/**/__tests__/**/*.${SOURCE}`], rules: { "@typescript-eslint/no-restricted-imports": "off" } },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "generated/**",
    "tools/oxlint/anti-slop/**",
  ]),
]);

export default eslintConfig;
