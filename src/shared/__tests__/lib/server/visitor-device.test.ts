/**
 * @jest-environment node
 */
import { createHash } from "node:crypto";
import {
  createVisitorDevice,
  getDeviceVisitorId,
  setVisitorDeviceCookie,
  VISITOR_DEVICE_COOKIE,
} from "@shared/lib/server/visitor-device";
import { getPrisma } from "@shared/lib/server/prisma";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

let jar = createCookieJar();

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
});

describe("createVisitorDevice", () => {
  it("stores only the SHA-256 of the generated device token and returns the raw token", async () => {
    const visitor = await createTestVisitor("Neo");

    const rawToken = await getPrisma().$transaction(async (tx) => {
      return createVisitorDevice(tx, visitor.id);
    });

    const [device] = await getPrisma().visitorDevice.findMany();

    expect(rawToken).toBeTruthy();
    expect(device.token).not.toBe(rawToken);
    expect(device.token).toBe(sha256(rawToken));
  });

  it("replaces any existing device of the visitor with the new token", async () => {
    const visitor = await createTestVisitor("Trinity");

    await getPrisma().$transaction(async (tx) => {
      return createVisitorDevice(tx, visitor.id);
    });

    const secondToken = await getPrisma().$transaction(async (tx) => {
      return createVisitorDevice(tx, visitor.id);
    });

    const devices = await getPrisma().visitorDevice.findMany({
      where: { visitorId: visitor.id },
    });

    expect(devices).toHaveLength(1);
    expect(devices[0].token).toBe(sha256(secondToken));
  });
});

describe("setVisitorDeviceCookie and getDeviceVisitorId", () => {
  it("sets an httpOnly and lax cookie for VISITOR_DEVICE_COOKIE", async () => {
    const token = "sample-raw-device-token";

    await setVisitorDeviceCookie(token);

    const cookie = jar.get(VISITOR_DEVICE_COOKIE);

    expect(cookie?.value).toBe(token);
    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  });

  it("returns the visitor id for a valid matching device cookie", async () => {
    const visitor = await createTestVisitor("Morpheus");

    const rawToken = await getPrisma().$transaction(async (tx) => {
      return createVisitorDevice(tx, visitor.id);
    });

    await setVisitorDeviceCookie(rawToken);

    const detectedId = await getDeviceVisitorId();

    expect(detectedId).toBe(visitor.id);
  });

  it("returns null when the cookie is missing or points to a non-existent device", async () => {
    expect(await getDeviceVisitorId()).toBeNull();

    await setVisitorDeviceCookie("non-existent-device-token");

    expect(await getDeviceVisitorId()).toBeNull();
  });
});

async function createTestVisitor(gamertag: string) {
  return getPrisma().visitor.create({
    data: {
      fullName: `User ${gamertag}`,
      gamertag,
      email: `${gamertag.toLowerCase()}@ut.mx`,
      pin: "sample-encrypted-pin",
      pinLookup: `lookup-${gamertag.toLowerCase()}`,
    },
  });
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
