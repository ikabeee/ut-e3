import { MY_ROLE_PATH } from "@features/accounts/lib/accounts-links";

// The staff areas: the proxy checks their session cookie and the site navbar stays out of them.
export const STAFF_AREAS = ["/admin", "/stand", "/support", MY_ROLE_PATH];
