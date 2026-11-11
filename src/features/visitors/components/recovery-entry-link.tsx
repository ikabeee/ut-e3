import Link from "next/link";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { RECOVER_PATH } from "@features/visitors/lib/visitors-links";

export function RecoveryEntryLink() {
  return (
    <Link
      href={RECOVER_PATH}
      className="touch-target relative text-center text-sm text-foreground underline underline-offset-4 hover:text-accent"
    >
      {VISITORS_COPY.recovery.entryLink}
    </Link>
  );
}
