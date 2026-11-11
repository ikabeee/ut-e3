/**
 * Datos generales del sitio (nombre, URL pública, textos de SEO).
 * Cambia `NEXT_PUBLIC_SITE_URL` en el `.env` del despliegue para generar URLs absolutas
 * correctas en metadata, sitemap y Open Graph.
 */
export const siteConfig = {
  name: "UTG",
  title: "UTG · Showcase de videojuegos",
  description:
    "Showcase de videojuegos de la División de Ingeniería y Tecnologías de la UT Cancún. Prueba los juegos, compite en los torneos y participa en los sorteos.",
  url: process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://localhost:3000",
  locale: "es_MX",
  organization: "División de Ingeniería y Tecnologías · UT Cancún",
  /** Imagen para compartir en redes cuando una página no define la suya. */
  shareImage: "/media/reel.jpg",
} as const;

/** Rutas principales del sitio. */
export const routes = {
  home: "/",
  games: "/games",
  floorPlan: "/floor-plan",
} as const;
