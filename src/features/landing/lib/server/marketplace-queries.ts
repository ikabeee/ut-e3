import "server-only";
import { connection } from "next/server";
import {
  getMarketplaceRegistration,
  type MarketplaceRegistration,
  type MarketplaceSettings,
} from "@features/landing/lib/marketplace-registration";

export async function getCurrentMarketplaceRegistration(
  settings: MarketplaceSettings,
): Promise<MarketplaceRegistration> {
  await connection();

  return getMarketplaceRegistration(settings, new Date());
}
