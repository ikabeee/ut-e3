import "server-only";

import type { Passport } from "@features/visitors/lib/types";
import { decryptPin } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export async function getPassport(visitorId: string): Promise<Passport | null> {
  const visitor = await getPrisma().visitor.findUnique({
    where: { id: visitorId },
    select: {
      gamertag: true,
      pin: true,
    },
  });

  if (!visitor) {
    return null;
  }

  return {
    gamertag: visitor.gamertag,
    pin: decryptPin(visitor.pin),
  };
}
