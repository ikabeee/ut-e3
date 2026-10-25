export interface EventSettings {
  eventStartsAt: string;
  eventEndsAt: string;
  registrationOpensAt: string;
  kofRegistrationOpensAt: string;
  kofCheckInStartsAt: string;
  kofCheckInEndsAt: string;
  kofOnsiteSignupStartsAt: string;
  kofOnsiteSignupEndsAt: string;
  kofBracketGeneratesAt: string;
  marketplaceClosesAt: string;
  marketplaceFormUrl: string | null;
  itchOpensAt: string;
  checkInCutoffAt: string;
  raffleStartsAt: string;
  publicBracketEnabled: boolean;
}
