import "server-only";
import type { Sponsor } from "@features/sponsors/lib/types";
import type { PrismaClient } from "@generated/prisma/client";

type SponsorFields = Pick<Sponsor, "name" | "logoPath"> &
  Partial<Pick<Sponsor, "websiteUrl" | "phone" | "email" | "services">>;

// The sponsors that gave a logo. What a source does not give stays empty and the cards leave it out.
const REAL_SPONSORS: SponsorFields[] = [
  {
    name: "Algorix Insights",
    logoPath: "/sponsors/algorix-insights.svg",
    websiteUrl: "https://algorixinsights.com",
    services: "Desarrollo web, agentes de IA y software a medida.",
  },
  {
    name: "Bonavida",
    logoPath: "/sponsors/bonavida.svg",
    websiteUrl: "https://aguabonavida.com.mx/",
    phone: "+529983048120",
  },
  { name: "Mermelada", logoPath: "/sponsors/mermelada.svg" },
  {
    name: "Nemo Submarine",
    logoPath: "/sponsors/nemo-submarine.svg",
    websiteUrl: "https://www.nemoisla.com/",
    phone: "+19038019083",
  },
  { name: "OpSET", logoPath: "/sponsors/opset.svg", phone: "+529981878194", email: "ceo@opset.com.mx" },
  {
    name: "Le Jardin d'Aurore",
    logoPath: "/sponsors/le-jardin-d-aurore.svg",
    email: "contacto@lejardindaurore.com",
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
