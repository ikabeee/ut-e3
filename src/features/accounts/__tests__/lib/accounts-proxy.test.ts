/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { redirectWithoutSession } from "@features/accounts/lib/accounts-proxy";

describe("redirectWithoutSession", () => {
  it("sends a request without a session cookie to /login", () => {
    const response = redirectWithoutSession(new NextRequest("https://utg.example/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://utg.example/login");
  });

  it("lets a request with a session cookie reach the page, which checks it against the database", () => {
    const request = new NextRequest("https://utg.example/admin", { headers: { cookie: "ut_session=token" } });

    expect(redirectWithoutSession(request).headers.get("x-middleware-next")).toBe("1");
  });
});
