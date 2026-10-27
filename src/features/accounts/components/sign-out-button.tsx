import { Button } from "@heroui/react";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";

// A plain form, so signing out also works before the page hydrates.
export function SignOutButton({ action }: Readonly<{ action: () => Promise<void> }>) {
  return (
    <form action={action}>
      <Button type="submit" variant="outline" className="min-h-11">
        {ACCOUNTS_COPY.signOut}
      </Button>
    </form>
  );
}
