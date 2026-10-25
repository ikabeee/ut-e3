import { env } from "@shared/lib/env";

const organization = {
  division: "División de Ingeniería y Tecnologías",
  university: "Universidad Tecnológica de Cancún",
  universityShortName: "UT Cancún",
} as const;

export const siteConfig = {
  name: "PIXEL & CODE",
  title: "PIXEL & CODE · Showcase de videojuegos",
  description: `Showcase PIXEL & CODE de videojuegos de la ${organization.division} de la ${organization.universityShortName}. Juega, califica y gana.`,
  url: env.siteUrl,
  locale: "es_MX",
  organization,
  organizationLabel: `${organization.division} · ${organization.universityShortName}`,
  shareImage: "/media/reel.jpg",
  themeColor: "#000000",
} as const;
