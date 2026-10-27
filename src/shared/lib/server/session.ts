import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@shared/lib/session-cookie";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";

export interface SessionAccount {
  id: string;
  email: string;
  name: string;
  role: string;
}

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const TOKEN_BYTES = 32;

const ACTIVE = "active";

// Only the SHA-256 of the token reaches the database (RNF-09), so a leaked table opens no session.
export async function createSession(accountId: string): Promise<void> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await getPrisma().session.create({ data: { accountId, token: hashToken(token), expiresAt } });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Safari drops Secure cookies on http://localhost, so development keeps them off.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Checked against the database on every call, so disabling an account or changing its role takes effect at once.
export async function getSessionAccount(): Promise<SessionAccount | null> {
  const token = await readSessionToken();

  if (!token) return null;

  const session = await getPrisma().session.findUnique({
    where: { token: hashToken(token) },
    select: { expiresAt: true, account: { select: { id: true, email: true, name: true, role: true, status: true } } },
  });

  if (!session || session.expiresAt.getTime() <= Date.now() || session.account.status !== ACTIVE) return null;

  const { id, email, name, role } = session.account;

  return { id, email, name, role };
}

export async function deleteSession(): Promise<void> {
  const token = await readSessionToken();

  if (token) {
    await getPrisma().session.deleteMany({ where: { token: hashToken(token) } });
  }

  (await cookies()).delete(SESSION_COOKIE);
}

async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value || undefined;
}
