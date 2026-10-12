import { env } from "@shared/lib/env";

/**
 * Quién organiza el showcase. Es el único lugar donde se escribe: los textos de las features
 * (presentación, "Acerca del juego", stands informativos...) lo componen con estos datos.
 */
const organization = {
  division: "División de Ingeniería y Tecnologías",
  university: "Universidad Tecnológica de Cancún",
  universityShortName: "UT Cancún",
} as const;

/**
 * Datos generales del sitio (nombre, URL pública, organización y textos de SEO). No conoce las
 * rutas ni las secciones: cada feature declara su ruta en `lib/*-links.ts` y la navegación vive en
 * la feature `site`.
 * La URL pública viene de `NEXT_PUBLIC_SITE_URL`, validada en `@shared/lib/env`: es
 * obligatoria en producción y genera las URLs absolutas de metadata, sitemap y Open Graph.
 */
export const siteConfig = {
  name: "UTG",
  title: "UTG · Showcase de videojuegos",
  description: `Showcase de videojuegos de la ${organization.division} de la ${organization.universityShortName}. Prueba los juegos, compite en los torneos y participa en los sorteos.`,
  url: env.siteUrl,
  locale: "es_MX",
  organization,
  /** La organización en una línea: "División de Ingeniería y Tecnologías · UT Cancún". */
  organizationLabel: `${organization.division} · ${organization.universityShortName}`,
  /** Imagen para compartir en redes cuando una página no define la suya. */
  shareImage: "/media/reel.jpg",
  /** Color de la barra del navegador y del fondo de la app instalada (`--utg-black`). */
  themeColor: "#000000",
} as const;
