export const REGISTER_PATH = "/register";

export const PASSPORT_PATH = "/passport";

export const PRIVACY_PATH = "/privacy";

// Self-service recovery by email (RF-68); an expired or used link lands on its own page, which asks for a new one.
export const RECOVER_PATH = "/passport/recover";

export const RECOVERY_LINK_EXPIRED_PATH = "/passport/recover/expired";

// Where a valid email link goes before it is used; the token travels in the fragment, which never reaches the server.
export const RECOVERY_CONFIRM_PATH = "/passport/recover/confirm";

// The recovery link of a passport (RF-68 and RF-69) is `${CLAIM_PATH}/<token>`; opening it makes that phone the active device.
export const CLAIM_PATH = "/passport/claim";

export function getClaimPath(token: string): string {
  return `${CLAIM_PATH}/${token}`;
}
