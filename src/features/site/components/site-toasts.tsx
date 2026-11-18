import { Toast } from "@heroui/react";
import { SITE_COPY } from "@features/site/lib/site-copy";

/** The one region of toasts of the site (S7): every error raised with `useErrorToast` is announced from here. */
export function SiteToasts() {
  return <Toast.Provider placement="bottom" aria-label={SITE_COPY.toasts.label} />;
}
