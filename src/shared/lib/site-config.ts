import { env } from "@shared/lib/env";

const organization = {
  division: "División de Ingeniería y Tecnologías",
  university: "Universidad Tecnológica de Cancún",
  universityShortName: "UT Cancún",
} as const;

export const siteConfig = {
  name: "UTG",
  title: "UTG · Showcase de videojuegos",
  description: `Showcase de videojuegos de la ${organization.division} de la ${organization.universityShortName}. Prueba los juegos, compite en los torneos y participa en la rifa.`,
  url: env.siteUrl,
  locale: "es_MX",
  organization,
  organizationLabel: `${organization.division} · ${organization.universityShortName}`,
  shareImage: "/media/reel.jpg",
  themeColor: "#000000",
} as const;
