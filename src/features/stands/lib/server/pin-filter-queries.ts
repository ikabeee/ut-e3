import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { buildPinFilter, type PinFilter } from "@features/stands/lib/pin-filter";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { VISITOR_PINS_CACHE_TAG } from "@features/visitors/lib/visitor-cache-tags";
import { decryptPin } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

/**
 * The filter of the registered PINs that the kiosks download (RF-78, RNF-19). Building it hashes every PIN, so it is
 * cached until a new visitor registers (`updateTag(VISITOR_PINS_CACHE_TAG)` in the registration).
 */
export async function getPinFilter(): Promise<PinFilter> {
  "use cache";
  cacheLife("hours");
  cacheTag(VISITOR_PINS_CACHE_TAG);

  const [settings, visitors] = await Promise.all([
    getPrisma().eventSettings.findUnique({ where: { id: 1 }, select: { pinFilterSalt: true } }),
    getPrisma().visitor.findMany({ select: { pin: true } }),
  ]);

  if (!settings) throw new Error(STANDS_COPY.kiosk.errors.missingSettings);

  return buildPinFilter(
    visitors.map((visitor) => decryptPin(visitor.pin)),
    settings.pinFilterSalt,
  );
}
