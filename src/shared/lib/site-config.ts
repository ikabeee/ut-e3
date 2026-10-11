import { env } from "@shared/lib/env";

/**
 * Datos generales del sitio (nombre, URL pública, textos de SEO).
 * La URL pública viene de `NEXT_PUBLIC_SITE_URL`, validada en `@shared/lib/env`: es
 * obligatoria en producción y genera las URLs absolutas de metadata, sitemap y Open Graph.
 */
export const siteConfig = {
  name: "UTG",
  title: "UTG · Showcase de videojuegos",
  description:
    "Showcase de videojuegos de la División de Ingeniería y Tecnologías de la UT Cancún. Prueba los juegos, compite en los torneos y participa en los sorteos.",
  url: env.siteUrl,
  locale: "es_MX",
  organization: "División de Ingeniería y Tecnologías · UT Cancún",
  /** Imagen para compartir en redes cuando una página no define la suya. */
  shareImage: "/media/reel.jpg",
  /** Color de la barra del navegador y del fondo de la app instalada (`--utg-black`). */
  themeColor: "#000000",
} as const;

/** Rutas principales del sitio. */
export const routes = {
  home: "/",
  games: "/games",
  floorPlan: "/floor-plan",
} as const;
