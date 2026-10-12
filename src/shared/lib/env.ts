/**
 * Variables de entorno validadas. Es el único módulo que lee `process.env`:
 * el resto de la app importa `env` y recibe valores ya tipados.
 *
 * Para agregar una variable:
 * 1. Agrégala a `EnvSource` y léela en `readProcessEnv()`.
 * 2. Escribe su validación (`parse<Variable>`) y agrégala a `Env` y a `parseEnv()`.
 * 3. Documéntala en `.env.example`.
 *
 * Este módulo también llega al bundle del navegador (lo importa `site-config.ts`). Ahí sólo
 * existen las variables `NEXT_PUBLIC_*`, que Next.js inserta en el build únicamente si se
 * escriben como `process.env.NEXT_PUBLIC_<NOMBRE>` (no con corchetes ni desestructurando).
 * Las demás (como `DATA_SOURCE`) sólo tienen valor en el servidor; en el navegador toman su
 * valor por defecto y no se usan.
 */

/** Valores crudos tal como llegan de `process.env`. */
export interface EnvSource {
  NODE_ENV?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  DATA_SOURCE?: string;
}

/** De dónde leen sus datos las features: los mocks del diseño o la base de datos. */
export const DATA_SOURCES = ["mock", "prisma"] as const;

export type DataSource = (typeof DATA_SOURCES)[number];

/** Variables validadas que consume la app. */
export interface Env {
  /** URL pública del sitio, absoluta y sin `/` final (`https://ejemplo.com`). */
  siteUrl: string;
  /** Fuente de datos del servidor (`DATA_SOURCE`); `mock` si no se define. */
  dataSource: DataSource;
}

/** URL pública que se usa en desarrollo y pruebas cuando falta `NEXT_PUBLIC_SITE_URL`. */
export const DEVELOPMENT_SITE_URL = "http://localhost:3000";

const SITE_URL_EXAMPLE = 'NEXT_PUBLIC_SITE_URL="https://ejemplo.com"';

/** Valida la URL pública. En producción es obligatoria; fuera de ella usa localhost. */
export function parseSiteUrl(value: string | undefined, nodeEnv: string | undefined): string {
  const siteUrl = value?.trim();

  if (!siteUrl) {
    if (nodeEnv === "production") {
      throw new Error(
        `Falta NEXT_PUBLIC_SITE_URL. Defínela en el entorno del build (por ejemplo ${SITE_URL_EXAMPLE}) para que canonical, Open Graph y sitemap no apunten a localhost.`,
      );
    }

    return DEVELOPMENT_SITE_URL;
  }

  if (!URL.canParse(siteUrl) || !/^https?:\/\//.test(siteUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL debe ser una URL absoluta http(s), por ejemplo ${SITE_URL_EXAMPLE}. Valor recibido: "${siteUrl}".`,
    );
  }

  if (siteUrl.endsWith("/")) {
    throw new Error(`NEXT_PUBLIC_SITE_URL no debe terminar en "/". Valor recibido: "${siteUrl}".`);
  }

  return siteUrl;
}

/** Valida la fuente de datos. Sin valor usa los mocks; un valor desconocido detiene el build. */
export function parseDataSource(value: string | undefined): DataSource {
  const dataSource = value?.trim() || "mock";
  const known = DATA_SOURCES.find((candidate) => candidate === dataSource);

  if (!known) {
    const options = DATA_SOURCES.map((name) => JSON.stringify(name)).join(" o ");
    throw new Error(`DATA_SOURCE debe ser ${options}. Valor recibido: "${dataSource}".`);
  }

  return known;
}

/** Valida todas las variables a partir de sus valores crudos. */
export function parseEnv(source: EnvSource): Env {
  return {
    siteUrl: parseSiteUrl(source.NEXT_PUBLIC_SITE_URL, source.NODE_ENV),
    dataSource: parseDataSource(source.DATA_SOURCE),
  };
}

function readProcessEnv(): EnvSource {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    DATA_SOURCE: process.env.DATA_SOURCE,
  };
}

/** Variables de entorno validadas al importar el módulo: un valor inválido detiene el build. */
export const env: Env = parseEnv(readProcessEnv());
