/**
 * @jest-environment node
 */
import { GET } from "@features/visitors/api/device-claim-route";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";
import { VISITOR_DEVICE_COOKIE, createVisitorDevice } from "@shared/lib/server/visitor-device";
import { createCookieJar, stubCookies } from "@shared/__tests__/lib/server/cookie-jar";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

process.env.PIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

let jar = createCookieJar();

let visitorId = "";

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

beforeEach(async () => {
  jar = createCookieJar();
  stubCookies(jar);
  await getPrisma().visitorDevice.deleteMany();
  await getPrisma().visitor.deleteMany();
  visitorId = (
    await getPrisma().visitor.create({
      data: {
        fullName: "Ana Pérez",
        gamertag: "Neo_01",
        email: "neo@example.com",
        pin: encryptPin("12345"),
        pinLookup: hashPinForLookup("12345"),
      },
    })
  ).id;
});

describe("GET /passport/claim/[token]", () => {
  it("makes the phone the device of the passport and sends it to the passport", async () => {
    const token = await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));

    const response = await claim(token);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/passport");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(jar.get(VISITOR_DEVICE_COOKIE)?.value).toBe(token);
  });

  it("sends a token replaced by a later recovery to the registration, without a cookie", async () => {
    const replaced = await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));

    await getPrisma().$transaction((transaction) => createVisitorDevice(transaction, visitorId));

    const response = await claim(replaced);

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/register");
    expect(jar.get(VISITOR_DEVICE_COOKIE)).toBeUndefined();
  });

  it("sends a made-up token to the registration", async () => {
    const response = await claim("no-existe");

    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/register");
    expect(jar.get(VISITOR_DEVICE_COOKIE)).toBeUndefined();
  });
});

function claim(token: string): Promise<Response> {
  return GET(new Request(`http://localhost/passport/claim/${token}`), { params: Promise.resolve({ token }) });
}
