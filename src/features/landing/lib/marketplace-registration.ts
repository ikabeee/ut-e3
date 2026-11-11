export type MarketplaceRegistration =
  { status: "open"; formUrl: string } | { status: "unannounced" } | { status: "closed" };

export interface MarketplaceSettings {
  formUrl: string | null;
  closesAt: string;
}

export function getMarketplaceRegistration(settings: MarketplaceSettings, now: Date): MarketplaceRegistration {
  if (now.getTime() >= Date.parse(settings.closesAt)) {
    return { status: "closed" };
  }

  if (settings.formUrl === null) {
    return { status: "unannounced" };
  }

  return { status: "open", formUrl: settings.formUrl };
}
