import "server-only";
import type { Sponsor } from "@features/sponsors/lib/types";
import type { PrismaClient } from "@generated/prisma/client";

interface ExampleSponsor {
  slug: string;
  name: string;
  services: string;
}

// Example sponsors until the real ones are confirmed: fictitious names, example.com sites and placeholder logos.
const EXAMPLE_SPONSORS: ExampleSponsor[] = [
  { slug: "arrecife-digital", name: "Arrecife Digital", services: "Desarrollo web y aplicaciones móviles." },
  { slug: "nodo-caribe", name: "Nodo Caribe", services: "Hospedaje de servidores y servicios en la nube." },
  { slug: "jaguar-byte", name: "Jaguar Byte", services: "Equipo, periféricos y accesorios para gaming." },
  { slug: "cenote-labs", name: "Cenote Labs", services: "Talleres de programación y robótica para jóvenes." },
  { slug: "marea-studio", name: "Marea Studio", services: "Arte digital, animación y modelado 3D." },
  { slug: "selva-net", name: "Selva Net", services: "Internet de alta velocidad para eventos." },
];

// Frozen because nothing appends to it at runtime: it changes only by editing this file.
export const INITIAL_SPONSORS: readonly Sponsor[] = Object.freeze(EXAMPLE_SPONSORS.map(toSponsor));

// Sponsors have no natural key, so the seed only fills an empty table; the database assigns UUID ids.
export async function seedSponsors(prisma: PrismaClient): Promise<void> {
  if ((await prisma.sponsor.count()) > 0) return;

  await prisma.sponsor.createMany({ data: INITIAL_SPONSORS.map(toSponsorRow) });
}

function toSponsorRow({ name, logoPath, websiteUrl, phone, services, position }: Sponsor) {
  return { name, logoPath, websiteUrl, phone, services, position };
}

function toSponsor({ slug, name, services }: ExampleSponsor, index: number): Sponsor {
  const position = index + 1;

  return {
    id: slug,
    name,
    logoPath: `/sponsors/${slug}.svg`,
    websiteUrl: `https://example.com/${slug}`,
    phone: `+52998000${String(position).padStart(4, "0")}`,
    services,
    position,
  };
}
