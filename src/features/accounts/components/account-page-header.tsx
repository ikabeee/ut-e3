import { SignOutButton } from "@features/accounts/components/sign-out-button";

interface AccountPageHeaderProps {
  title: string;
  signedInAs: string;
  signOutAction: () => Promise<void>;
}

export function AccountPageHeader({ title, signedInAs, signOutAction }: Readonly<AccountPageHeaderProps>) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="type-section">{title}</h1>
        <p className="mt-2 text-sm text-muted">{signedInAs}</p>
      </div>
      <SignOutButton action={signOutAction} />
    </header>
  );
}
