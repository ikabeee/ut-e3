import "server-only";
import type { Sponsor } from "@features/sponsors/lib/types";
import type { PrismaClient } from "@generated/prisma/client";

type SponsorFields = Pick<Sponsor, "name" | "logoPath"> &
  Partial<Pick<Sponsor, "websiteUrl" | "phone" | "email" | "services">>;

// The sponsors that gave a logo, all from Cancún. The data of their folder wins; the rest comes from their public web
// presence. What no source gives stays empty and the cards leave it out. Every sponsor has a short Spanish services
// sentence, except Directrix Studio (no source describes it). New sponsors go at the end, in alphabetical order, so
// the positions of the existing ones never move (sponsors-backfill.ts adds them to a database that already has rows).
const REAL_SPONSORS: SponsorFields[] = [
  {
    name: "Algorix Insights",
    logoPath: "/sponsors/algorix-insights.svg",
    websiteUrl: "https://algorixinsights.com",
    services: "Desarrollo de software a la medida, sitios web y agentes de IA para automatizar negocios.",
  },
  {
    name: "Bonavida",
    logoPath: "/sponsors/bonavida.svg",
    websiteUrl: "https://aguabonavida.com.mx",
    phone: "+529983048120",
    email: "ventas@aguabonavida.com.mx",
    services: "Agua purificada a domicilio en Cancún.",
  },
  {
    name: "Mermelada",
    logoPath: "/sponsors/mermelada.svg",
    websiteUrl: "https://mermeladacocinaquereconforta.com",
    phone: "+529981819937",
    email: "mermeladacancun@gmail.com",
    services: "Restaurante de desayunos y comida con recetas inspiradas en sabores regionales en Cancún.",
  },
  // The phone is the only one the sponsor gave (+1); no local number is confirmed.
  {
    name: "Nemo Submarine",
    logoPath: "/sponsors/nemo-submarine.svg",
    websiteUrl: "https://www.nemoisla.com/",
    phone: "+19038019083",
    services: "Paseos en submarino para ver arrecifes y vida marina en Isla Mujeres.",
  },
  {
    name: "OpSET",
    logoPath: "/sponsors/opset.svg",
    websiteUrl: "https://opset.com.mx",
    phone: "+529981878194",
    email: "ceo@opset.com.mx",
    services: "Desarrollo de sitios web, tiendas en línea, plataformas a la medida y branding en Cancún.",
  },
  {
    name: "Le Jardin d'Aurore",
    logoPath: "/sponsors/le-jardin-d-aurore.svg",
    websiteUrl: "https://lejardindaurore.com",
    phone: "+529981878194",
    email: "contacto@lejardindaurore.com",
    services: "Boutique floral que crea pequeños jardines botánicos y arreglos de plantas para el hogar.",
  },
  {
    name: "Noxy Digital",
    logoPath: "/sponsors/noxy-digital.png",
    websiteUrl: "https://www.noxy.digital/",
    phone: "+529981725547",
    email: "info@noxy.digital",
    services: "Estudio de diseño y desarrollo de sitios web, tiendas en línea y plataformas.",
  },
  // The sponsor model has one phone and one website: the second phone (998 768 2460) is left out, and the website is
  // the Facebook page of the agency, which is the only web presence the sponsor gave. No source describes its services.
  {
    name: "Directrix Studio",
    logoPath: "/sponsors/directrix-studio.png",
    websiteUrl: "https://www.facebook.com/GrupoDirectrixAgenciaCreativa/",
    phone: "+529981268631",
    email: "directrixstudio@gmail.com",
  },
  {
    name: "Dolphin Discovery",
    logoPath: "/sponsors/dolphin-discovery.png",
    websiteUrl: "https://www.dolphindiscovery.com.mx/",
    phone: "+529981933360",
    email: "customercare@dolphindiscovery.com",
    services: "Programas de nado e interacción con delfines en Cancún, Isla Mujeres y la Riviera Maya.",
  },
  {
    name: "Fresh Air",
    logoPath: "/sponsors/fresh-air.svg",
    websiteUrl: "https://freshair.com.mx/",
    phone: "+529981802252",
    services: "Renta de coolers evaporativos y climas portátiles para eventos en Cancún y la Riviera Maya.",
  },
  {
    name: "Pixel & Code",
    logoPath: "/sponsors/pixel-and-code.png",
    websiteUrl: "https://pixelandcode.org",
    phone: "+529988941923",
    services: "Portales inmobiliarios y sitios web para captar clientes en Cancún.",
  },
  {
    name: "Rock and Race",
    logoPath: "/sponsors/rock-and-race.png",
    websiteUrl: "https://www.rockandrace.com",
    phone: "+529982893135",
    email: "info@rockandrace.com",
    services: "Pista de arrancones en autos clásicos en Go Grand Outlet Cancún.",
  },
  {
    name: "Target G",
    logoPath: "/sponsors/target-g.png",
    services: "Campo de tiro recreativo con lanzadores no letales en Go Grand Outlet Cancún.",
  },
];

// Frozen because nothing appends to it at runtime: it changes only by editing this file.
export const INITIAL_SPONSORS: readonly Sponsor[] = Object.freeze(REAL_SPONSORS.map(toSponsor));

// Sponsors have no natural key, so the seed only fills an empty table; the database assigns UUID ids.
export async function seedSponsors(prisma: PrismaClient): Promise<void> {
  if ((await prisma.sponsor.count()) > 0) return;

  await prisma.sponsor.createMany({ data: INITIAL_SPONSORS.map(toSponsorRow) });
}

function toSponsorRow({ name, logoPath, websiteUrl, phone, email, services, position }: Sponsor) {
  return { name, logoPath, websiteUrl, phone, email, services, position };
}

function toSponsor(
  { name, logoPath, websiteUrl = "", phone = "", email = null, services = "" }: SponsorFields,
  index: number,
): Sponsor {
  return { id: slugify(name), name, logoPath, websiteUrl, phone, email, services, position: index + 1 };
}

function slugify(name: string): string {
  return name.toLowerCase().replaceAll(/\s+/g, "-");
}
