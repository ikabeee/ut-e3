import { MyRoleCard } from "@features/accounts/components/my-role-card";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { MyRoleCard as MyRoleCardData } from "@features/accounts/lib/my-role";

const COPY = ACCOUNTS_COPY.myRole;

/** The roles of the account, the primary first; an account with two roles gets a note that says so. */
export function MyRoleCards({ cards }: Readonly<{ cards: MyRoleCardData[] }>) {
  if (cards.length === 0) return <p className="text-muted">{COPY.empty}</p>;

  return (
    <div className="grid gap-6">
      {cards.length > 1 ? <p className="text-muted">{COPY.dualNote}</p> : null}
      {cards.map((card) => (
        <MyRoleCard key={card.role} card={card} />
      ))}
    </div>
  );
}
