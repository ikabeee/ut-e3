import { SignOutButton } from "@features/accounts/components/sign-out-button";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import { MY_ROLE_PATH } from "@features/accounts/lib/accounts-links";
import { ActionLink } from "@shared/components/action-link";

interface AccountPageHeaderProps {
  title: string;
  signedInAs: string;
  signOutAction: () => Promise<void>;
  /** The link to the page of the role (S4); the page of the role itself leaves it out. */
  showRoleLink?: boolean;
}

export function AccountPageHeader({
  title,
  signedInAs,
  signOutAction,
  showRoleLink = true,
}: Readonly<AccountPageHeaderProps>) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="type-section">{title}</h1>
        <p className="mt-2 text-sm text-muted">{signedInAs}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {showRoleLink ? (
          <ActionLink href={MY_ROLE_PATH} variant="outline" className="min-h-11">
            {ACCOUNTS_COPY.myRole.link}
          </ActionLink>
        ) : null}
        <SignOutButton action={signOutAction} />
      </div>
    </header>
  );
}
