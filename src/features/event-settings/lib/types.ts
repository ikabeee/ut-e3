export interface EventSettings {
  eventStartsAt: string;
  eventEndsAt: string;
  registrationOpensAt: string;
  kofRegistrationOpensAt: string;
  kofRegistrationClosesAt: string;
  marketplaceClosesAt: string;
  marketplaceFormUrl: string | null;
  itchOpensAt: string;
  checkInCutoffAt: string;
  raffleStartsAt: string;
  publicBracketEnabled: boolean;
}
