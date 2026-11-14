/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { redirectWithoutSession } from "@features/accounts/lib/accounts-proxy";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// The tests of the fallback must not depend on the .env of whoever runs them.
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

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

  it("sends the visitor to /login on the public origin when the request carries the internal one", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://showcase.example.com";

    const response = redirectWithoutSession(new NextRequest("http://localhost:3000/admin"));

    expect(response.headers.get("location")).toBe("https://showcase.example.com/login");
  });

  it("keeps the origin of the request when NEXT_PUBLIC_SITE_URL is blank or is not a usable URL", () => {
    for (const value of ["  ", "no-es-una-url", "ftp://showcase.example.com"]) {
      process.env.NEXT_PUBLIC_SITE_URL = value;

      const response = redirectWithoutSession(new NextRequest("http://localhost:3000/admin"));

      expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    }
  });
});
