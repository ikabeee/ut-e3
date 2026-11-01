import "server-only";
import type { AccountStatus } from "@features/accounts/lib/types";
import { getPrisma } from "@shared/lib/server/prisma";

const ACTIVE: AccountStatus = "active";

// Only active accounts can sign in; an invited or disabled one looks the same as an unknown email.
export function findSignInAccount(email: string) {
  return getPrisma().account.findFirst({
    where: { email, status: ACTIVE },
    select: { id: true, password: true, role: true },
  });
}
