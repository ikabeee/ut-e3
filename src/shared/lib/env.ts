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
 * Las demás (como las credenciales del panel) sólo tienen valor en el servidor:
 * Next.js no las incluye en el bundle del navegador, donde toman su valor por defecto y no se usan.
 */
import { parseImageHosts } from "@shared/lib/image-hosts";

/** Valores crudos tal como llegan de `process.env`. */
export interface EnvSource {
  NODE_ENV?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  DATA_SOURCE?: string;
  IMAGE_REMOTE_HOSTS?: string;
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM?: string;
}

/** Configuración de conexión SMTP para el envío de correos vía Nodemailer. */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

/** Variables validadas que consume la app. */
export interface Env {
  /** URL pública del sitio, absoluta y sin `/` final (`https://ejemplo.com`). */
  siteUrl: string;
  /** Dominios de las fotos de juegos por URL https (`IMAGE_REMOTE_HOSTS`, separados por comas). */
  imageRemoteHosts: string[];
  /** Credenciales HTTP Basic del panel (`ADMIN_USER` y `ADMIN_PASSWORD`); `null` si falta alguna. */
  admin: AdminCredentials | null;
  /** Configuración SMTP para envío de correos salientes; `null` si no hay credenciales configuradas. */
  smtp: SmtpConfig | null;
  /** Dirección y nombre de remitente por defecto para los correos enviados. */
  emailFrom: string;
}

export interface AdminCredentials {
  user: string;
  password: string;
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

/**
 * Credenciales del panel de administración. Sin las dos variables, todas las acciones de
 * administración se rechazan (nadie puede modificar los datos).
 */
export function parseAdminCredentials(user: string | undefined, password: string | undefined): AdminCredentials | null {
  return user && password ? { user, password } : null;
}

/** Dirección de correo y nombre de remitente por defecto. */
export const DEFAULT_EMAIL_FROM = '"UT Game Showcase" <no-reply@showcase.ute3.edu.mx>';

/** Valida o normaliza la dirección de remitente de correos. */
export function parseEmailFrom(value: string | undefined): string {
  const from = value?.trim();

  return from || DEFAULT_EMAIL_FROM;
}

/**
 * Valida la configuración SMTP para Nodemailer. Si falta host, usuario o contraseña,
 * devuelve null (los correos se imprimirán en consola en desarrollo).
 */
export function parseSmtpConfig(source: EnvSource): SmtpConfig | null {
  const host = source.SMTP_HOST?.trim();
  const user = source.SMTP_USER?.trim();
  const password = source.SMTP_PASSWORD;

  if (!host || !user || !password) {
    return null;
  }

  const rawPort = source.SMTP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : 587;

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`SMTP_PORT debe ser un número de puerto válido. Valor recibido: "${rawPort}".`);
  }

  const secure = source.SMTP_SECURE !== undefined ? source.SMTP_SECURE.trim().toLowerCase() === "true" : port === 465;

  return {
    host,
    port,
    secure,
    user,
    password,
    from: parseEmailFrom(source.EMAIL_FROM),
  };
}

/** Valida todas las variables a partir de sus valores crudos. */
export function parseEnv(source: EnvSource): Env {
  return {
    siteUrl: parseSiteUrl(source.NEXT_PUBLIC_SITE_URL, source.NODE_ENV),
    imageRemoteHosts: parseImageHosts(source.IMAGE_REMOTE_HOSTS),
    admin: parseAdminCredentials(source.ADMIN_USER, source.ADMIN_PASSWORD),
    smtp: parseSmtpConfig(source),
    emailFrom: parseEmailFrom(source.EMAIL_FROM),
  };
}

function readProcessEnv(): EnvSource {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    DATA_SOURCE: process.env.DATA_SOURCE,
    IMAGE_REMOTE_HOSTS: process.env.IMAGE_REMOTE_HOSTS,
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
}

/** Variables de entorno validadas al importar el módulo: un valor inválido detiene el build. */
export const env: Env = parseEnv(readProcessEnv());
