import Link from "next/link";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";

export function PrivacyNotice() {
  return (
    <p className="text-center type-tiny text-muted">
      {VISITORS_COPY.privacy.shortNotice}{" "}
      <Link href={PRIVACY_PATH} className="text-foreground underline underline-offset-4 hover:text-accent">
        {VISITORS_COPY.privacy.linkText}
      </Link>
      .
    </p>
  );
}
