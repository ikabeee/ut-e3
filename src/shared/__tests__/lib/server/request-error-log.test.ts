/**
 * @jest-environment node
 */
import { getPrisma } from "@shared/lib/server/prisma";
import { logRequestError } from "@shared/lib/server/request-error-log";
import { createTestDatabase } from "@shared/__tests__/lib/server/test-database";

const database = createTestDatabase();

process.env.DATABASE_URL = database.url;

afterAll(async () => {
  await getPrisma().$disconnect();
  database.remove();
});

describe("logRequestError", () => {
  it("records the route, the method and the digest, and never the visited path with its token", async () => {
    const cause = Object.assign(new Error("Boom"), { digest: "d-123" });

    await logRequestError(
      cause,
      { method: "GET", path: "/reset-password/abcdefghijklmnopqrstuvwxyz123456?token=secret" },
      { routePath: "/reset-password/[token]", routeType: "render" },
    );

    const row = await getPrisma().serverLog.findFirstOrThrow({ where: { source: "request" } });

    expect(row).toMatchObject({ level: "error", message: "Request error: Error" });
    expect(row.details).toEqual({
      route: "/reset-password/[token]",
      routeType: "render",
      method: "GET",
      digest: "d-123",
    });
    expect(JSON.stringify(row)).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
    expect(JSON.stringify(row)).not.toContain("Boom");
    expect(Object.keys(row.details ?? {}).toSorted()).toEqual(["digest", "method", "route", "routeType"]);
  });

  it("never stores the free message of the error, only its class", async () => {
    await logRequestError(
      new TypeError("Cannot read ana@ut.mx token=abc"),
      { method: "GET", path: "/x" },
      { routePath: "/x", routeType: "render" },
    );

    await expect(
      getPrisma().serverLog.findFirstOrThrow({ where: { message: { contains: "TypeError" } } }),
    ).resolves.toMatchObject({
      message: "Request error: TypeError",
    });
    await expect(getPrisma().serverLog.count({ where: { message: { contains: "ana" } } })).resolves.toBe(0);
  });

  it("accepts a value that is not an Error and no digest", async () => {
    await getPrisma().serverLog.deleteMany();

    await logRequestError(
      "plain text",
      { method: "POST", path: "/api/x" },
      { routePath: "/api/y", routeType: "route" },
    );

    await expect(getPrisma().serverLog.findFirstOrThrow()).resolves.toMatchObject({
      message: "Request error: NonError",
      details: { route: "/api/y", method: "POST" },
    });
  });
});
