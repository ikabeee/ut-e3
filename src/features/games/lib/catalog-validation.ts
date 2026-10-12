import type { CatalogOptionInput, GameImageInput, GameInput } from "@features/games/lib/types";
import { env } from "@shared/lib/env";
import { isAllowedImageUrl } from "@shared/lib/image-hosts";
import { isUuid, SLUG_PATTERN, validate, type RawInput } from "@shared/lib/validation";

// Validación del catálogo: las mismas reglas que los CHECK de contract.prisma, con mensajes
// en español para el panel de administración.

const ITCHIO_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.itch\.io\//;
const SLUG_MESSAGE = "El slug sólo lleva minúsculas, números y guiones (por ejemplo ruta-9).";

/** Género o plataforma. */
export function parseCatalogOptionInput(raw: RawInput): CatalogOptionInput {
  return validate(raw, (field) => ({
    slug: field.text("slug", { label: "El slug", max: 40, pattern: SLUG_PATTERN, patternMessage: SLUG_MESSAGE }),
    name: field.text("name", { label: "El nombre", max: 40 }),
  }));
}

export function parseGameInput(raw: RawInput): GameInput {
  return validate(raw, (field) => {
    const input = {
      teamId: field.text("teamId", { label: "El equipo", max: 36 }),
      genreId: field.text("genreId", { label: "El género principal", max: 36 }),
      slug: field.text("slug", { label: "El slug", max: 80, pattern: SLUG_PATTERN, patternMessage: SLUG_MESSAGE }),
      name: field.text("name", { label: "El nombre", max: 80 }),
      description: field.text("description", { label: "La descripción", max: 300 }),
      about: field.optionalText("about", { label: "Acerca del juego", max: 3000 }),
      players: field.integer("players", { label: "Los jugadores", min: 1, max: 16, fallback: 1 }),
      itchioUrl: field.optionalText("itchioUrl", {
        label: "El enlace de itch.io",
        max: 300,
        pattern: ITCHIO_URL_PATTERN,
        patternMessage: "El enlace debe ser una página de itch.io (https://<usuario>.itch.io/...).",
      }),
      sortOrder: field.integer("sortOrder", { label: "El orden", min: 0, max: 999, fallback: 0 }),
      extraGenreIds: field.list("extraGenreIds"),
      platformIds: field.list("platformIds"),
    };

    // Reglas entre campos que la base no puede expresar con un CHECK.
    if (!isUuid(input.teamId)) field.invalid("teamId", "Elige un equipo.");
    if (!isUuid(input.genreId)) field.invalid("genreId", "Elige el género principal.");
    if (input.platformIds.length === 0) field.invalid("platformIds", "Elige al menos una plataforma.");
    if (input.platformIds.some((id) => !isUuid(id)))
      field.invalid("platformIds", "Hay una plataforma que ya no existe.");
    if (input.extraGenreIds.some((id) => !isUuid(id)))
      field.invalid("extraGenreIds", "Hay un género que ya no existe.");
    if (input.extraGenreIds.includes(input.genreId)) {
      field.invalid("extraGenreIds", "Los géneros extra no pueden repetir el género principal.");
    }
    return input;
  });
}

/**
 * Foto de un juego: ruta del sitio o URL https de un dominio de `IMAGE_REMOTE_HOSTS`
 * (ver `@shared/lib/image-hosts`). Las dimensiones se validarán según el issue #62.
 */
export function parseGameImageInput(
  raw: RawInput,
  imageHosts: readonly string[] = env.imageRemoteHosts,
): GameImageInput {
  return validate(raw, (field) => {
    const input = {
      imageUrl: field.text("imageUrl", { label: "La URL de la imagen", max: 500 }),
      altText: field.text("altText", { label: "El texto alternativo", max: 160 }),
      cropPosition: field.optionalText("cropPosition", { label: "El encuadre", max: 20 }),
      isCover: field.boolean("isCover"),
      sortOrder: field.integer("sortOrder", { label: "La posición", min: 0, max: 4 }),
    };
    if (!isAllowedImageUrl(input.imageUrl, imageHosts)) {
      const allowed = imageHosts.length > 0 ? `: ${imageHosts.join(", ")}` : " (no hay ninguno configurado)";
      field.invalid(
        "imageUrl",
        `La imagen debe ser una ruta del sitio (/...) o una URL https de un dominio permitido${allowed}.`,
      );
    }
    return input;
  });
}
