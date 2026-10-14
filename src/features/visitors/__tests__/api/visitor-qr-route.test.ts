/**
 * @jest-environment node
 */
import { createVisitorQrRoute } from "@features/visitors/api/visitor-qr-route";

const TOKEN = "0123456789abcdef0123456789abcdef";

describe("GET /v/<token>", () => {
  it("restores the passport cookie and goes to the passport without leaking the token", async () => {
    const findVisitor = jest.fn(async () => ({
      id: "visitor-1",
      gamertag: "neo_99",
      fullName: null,
      email: null,
    }));

    const route = createVisitorQrRoute(findVisitor);

    const response = await route(new Request(`http://localhost/v/${TOKEN.toUpperCase()}`), {
      params: Promise.resolve({ token: TOKEN.toUpperCase() }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/passport");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("set-cookie")).toContain(`utg_visitor=${TOKEN}`);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(findVisitor).toHaveBeenCalledWith(TOKEN);
  });

  it("warns about a replaced QR without setting the cookie", async () => {
    const findVisitor = jest.fn(async () => null);
    const route = createVisitorQrRoute(findVisitor);

    const response = await route(new Request(`http://localhost/v/${TOKEN}`), {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/passport?qr=unknown");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
