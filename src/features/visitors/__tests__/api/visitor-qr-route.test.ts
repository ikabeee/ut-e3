/**
 * @jest-environment node
 */
import { GET } from "@features/visitors/api/visitor-qr-route";
import { findVisitorByToken } from "@features/visitors/lib/server/visitors-queries";

jest.mock("@features/visitors/lib/server/visitors-queries", () => ({ findVisitorByToken: jest.fn() }));

const TOKEN = "0123456789abcdef0123456789abcdef";

function open(token: string) {
  return GET(new Request(`http://localhost/v/${token}`), { params: Promise.resolve({ token }) });
}

describe("GET /v/<token>", () => {
  it("restores the passport cookie and goes to the passport without leaking the token", async () => {
    jest.mocked(findVisitorByToken).mockResolvedValue({ id: "visitor-1", gamertag: "neo_99" });

    const response = await open(TOKEN.toUpperCase());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/passport");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("set-cookie")).toContain(`utg_visitor=${TOKEN}`);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(findVisitorByToken).toHaveBeenCalledWith(TOKEN);
  });

  it("warns about a replaced QR without setting the cookie", async () => {
    jest.mocked(findVisitorByToken).mockResolvedValue(null);

    const response = await open(TOKEN);

    expect(response.headers.get("location")).toBe("/passport?qr=unknown");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
