import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";
import { hashToken } from "@shared/lib/server/token-hash";

export const VISITOR_DEVICE_COOKIE = "ut_visitor_device";

const TOKEN_BYTES = 32;

export async function createVisitorDevice(transaction: Prisma.TransactionClient, visitorId: string): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const hashedToken = hashToken(token);

  await transaction.visitorDevice.upsert({
    where: { visitorId },
    update: { token: hashedToken },
    create: { visitorId, token: hashedToken },
  });

  return token;
}

export async function setVisitorDeviceCookie(token: string): Promise<void> {
  (await cookies()).set(VISITOR_DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getDeviceVisitorId(): Promise<string | null> {
  const token = await readVisitorDeviceToken();

  if (!token) {
    return null;
  }

  const device = await getPrisma().visitorDevice.findUnique({
    where: { token: hashToken(token) },
    select: { visitorId: true },
  });

  return device?.visitorId ?? null;
}

async function readVisitorDeviceToken(): Promise<string | null> {
  return (await cookies()).get(VISITOR_DEVICE_COOKIE)?.value || null;
}
