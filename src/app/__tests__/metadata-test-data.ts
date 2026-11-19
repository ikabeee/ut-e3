import { getPrisma } from "@shared/lib/server/prisma";

// src/app only renders pages, so these tests write their rows with Prisma instead of the seeds of the features.
const VERTICAL = { path: "/games/x.jpg", alt: "Portada", position: 1, isCover: true };

const HORIZONTAL = { path: "/games/x-portada.jpg", alt: "Portada horizontal", position: 2, isCover: false };

export const EVENT_STARTS_AT = "2026-11-20T17:00:00.000Z";

export async function createEventSettings(): Promise<void> {
  await getPrisma().eventSettings.create({
    data: {
      eventStartsAt: EVENT_STARTS_AT,
      eventEndsAt: "2026-11-20T23:30:00.000Z",
      registrationOpensAt: "2026-11-13T05:00:00.000Z",
      kofRegistrationOpensAt: "2026-11-13T05:00:00.000Z",
      kofCheckInStartsAt: "2026-11-20T17:00:00.000Z",
      kofCheckInEndsAt: "2026-11-20T17:45:00.000Z",
      kofOnsiteSignupStartsAt: "2026-11-20T17:00:00.000Z",
      kofOnsiteSignupEndsAt: "2026-11-20T17:45:00.000Z",
      kofBracketGeneratesAt: "2026-11-20T17:55:00.000Z",
      marketplaceClosesAt: "2026-11-11T04:59:00.000Z",
      itchOpensAt: "2026-11-20T21:30:00.000Z",
      checkInCutoffAt: "2026-11-20T21:50:00.000Z",
      raffleStartsAt: "2026-11-20T23:00:00.000Z",
      publicBracketEnabled: true,
    },
  });
}

/** A game that the public catalog hides: it has no horizontal image yet. */
export async function createGameWithoutArtwork(slug: string, number: number): Promise<void> {
  await createPublicGame(slug, number);

  await getPrisma().gameImage.deleteMany({ where: { game: { slug }, isCover: false } });
}

/** A game of the public catalog (it has both images) at stand ZA-S<number>. */
export async function createPublicGame(slug: string, number: number): Promise<void> {
  const genre = await getPrisma().genre.upsert({
    where: { slug: "accion" },
    update: {},
    create: { name: "Acción", slug: "accion" },
  });

  const stand = await getPrisma().stand.create({ data: { zone: "A", number, studio: 4, groupCode: "103" } });

  await getPrisma().game.create({
    data: {
      slug,
      name: slug,
      synopsis: "Juego de prueba.",
      genreId: genre.id,
      standId: stand.id,
      images: { create: [VERTICAL, HORIZONTAL] },
    },
  });
}
