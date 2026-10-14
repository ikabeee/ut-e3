import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { siteConfig } from "@shared/lib/site-config";

export const AUTH_COOKIE_NAME = "utg_session";

export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

const SESSION_SECRET = process.env["SESSION_SECRET"] || "utg_showcase_session_secret_key_2026";

export interface SessionPayload {
  role: "admin" | "team";
  userId: string;
  email: string;
  username?: string;
  teamId?: string;
  teamName?: string;
  standCode?: string | null;
}

export function signSessionPayload(data: string): string {
  const hmac = createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  const dataB64 = Buffer.from(data).toString("base64url");

  return `${dataB64}.${hmac}`;
}

export function decodeSessionCookie(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");

  if (parts.length !== 2) return null;
  const [dataB64, hmacReceived] = parts;

  if (!dataB64 || !hmacReceived) return null;

  try {
    const rawData = Buffer.from(dataB64, "base64url").toString("utf-8");
    const expectedHmac = createHmac("sha256", SESSION_SECRET).update(rawData).digest("base64url");

    const bufA = Buffer.from(hmacReceived);
    const bufB = Buffer.from(expectedHmac);

    if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
      return null;
    }

    // SAFETY: La cookie firmada y verificada contiene el SessionPayload serializado en JSON.
    return JSON.parse(rawData) as SessionPayload;
  } catch {
    return null;
  }
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: siteConfig.url.startsWith("https://"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  };
}

export async function getAuthSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    return decodeSessionCookie(cookieValue);
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: SessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const signed = signSessionPayload(JSON.stringify(session));

  cookieStore.set(AUTH_COOKIE_NAME, signed, getAuthCookieOptions());
}

export async function clearAuthSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAME);
}
