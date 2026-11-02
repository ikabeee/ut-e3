export const REGISTER_PATH = "/register";

export const PASSPORT_PATH = "/passport";

export const PRIVACY_PATH = "/privacy";

// The recovery link of a passport (RF-69) is `${CLAIM_PATH}/<token>`; opening it makes that phone the active device.
export const CLAIM_PATH = "/passport/claim";

export function getClaimPath(token: string): string {
  return `${CLAIM_PATH}/${token}`;
}
