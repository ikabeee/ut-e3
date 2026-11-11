/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { proxySiteRequest } from "@features/site/lib/site-proxy";

const SITE = "https://utg.example";

function request(pathname: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`${SITE}${pathname}`, init);
}

describe("proxySiteRequest in landing mode", () => {
  it("lets the landing through", () => {
    expect(proxySiteRequest(request("/"), "landing").headers.get("x-middleware-next")).toBe("1");
  });

  it("sends a blocked page back to the landing", () => {
    const response = proxySiteRequest(request("/passport"), "landing");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${SITE}/`);
  });

  it("sends the staff pages back to the landing even with a session cookie", () => {
    const response = proxySiteRequest(request("/admin", { headers: { cookie: "ut_session=token" } }), "landing");

    expect(response.headers.get("location")).toBe(`${SITE}/`);
  });

  it("answers a blocked endpoint with 404 and no body", async () => {
    const response = proxySiteRequest(request("/api/raffle"), "landing");

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });

  it("refuses a Server Action sent to the landing with 405", () => {
    const response = proxySiteRequest(
      request("/", { method: "POST", headers: { "next-action": "0123456789abcdef" } }),
      "landing",
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
  });
});

describe("proxySiteRequest in full mode", () => {
  it("keeps sending a staff page without a session to /login", () => {
    const response = proxySiteRequest(request("/support/recovery"), "full");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${SITE}/login`);
  });

  it("lets a staff page with a session cookie through", () => {
    const response = proxySiteRequest(request("/stand/kiosk", { headers: { cookie: "ut_session=token" } }), "full");

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("lets a public page through without a session", () => {
    expect(proxySiteRequest(request("/passport"), "full").headers.get("x-middleware-next")).toBe("1");
  });

  it("does not treat a path that only starts like a staff page as one", () => {
    expect(proxySiteRequest(request("/standings"), "full").headers.get("x-middleware-next")).toBe("1");
  });
});
