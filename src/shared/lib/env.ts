export interface EnvSource {
  NODE_ENV?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

export interface Env {
  siteUrl: string;
}

export const DEVELOPMENT_SITE_URL = "http://localhost:3000";

const SITE_URL_EXAMPLE = 'NEXT_PUBLIC_SITE_URL="https://ejemplo.com"';

export function parseEnv(source: EnvSource): Env {
  return {
    siteUrl: parseSiteUrl(source.NEXT_PUBLIC_SITE_URL, source.NODE_ENV),
  };
}

export function parseSiteUrl(value: string | undefined, nodeEnv: string | undefined): string {
  const siteUrl = value?.trim();

  if (!siteUrl) {
    if (nodeEnv === "production") {
      throw new Error(
        `Falta NEXT_PUBLIC_SITE_URL. Defínela en el entorno del build (por ejemplo ${SITE_URL_EXAMPLE}) para que canonical y Open Graph no apunten a localhost.`,
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

function readProcessEnv(): EnvSource {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };
}

export const env: Env = parseEnv(readProcessEnv());
