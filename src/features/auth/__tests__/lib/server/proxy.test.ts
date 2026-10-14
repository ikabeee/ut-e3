/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { proxy } from "@features/auth/lib/server/proxy";
import { AUTH_COOKIE_NAME, signSessionPayload, type SessionPayload } from "@shared/lib/server/session";

function createCookieHeader(session: SessionPayload): string {
  const signed = signSessionPayload(JSON.stringify(session));

  return `${AUTH_COOKIE_NAME}=${signed}`;
}

describe("proxy middleware", () => {
  it("clears auth cookie and allows /login when logout=true query parameter is present", () => {
    const session: SessionPayload = {
      role: "team",
      userId: "u-1",
      email: "leader@ut.edu",
      teamId: "team-1",
    };

    const req = new NextRequest("http://localhost:3000/login?logout=true", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
  });

  it("redirects /login to /team when user has active team session with teamId", () => {
    const session: SessionPayload = {
      role: "team",
      userId: "u-1",
      email: "leader@ut.edu",
      teamId: "team-1",
    };

    const req = new NextRequest("http://localhost:3000/login", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/team");
  });

  it("does not redirect /login to /team when teamId is missing in session", () => {
    const session: SessionPayload = {
      role: "team",
      userId: "u-1",
      email: "leader@ut.edu",
    };

    const req = new NextRequest("http://localhost:3000/login", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects /login to /admin when user has active admin session", () => {
    const session: SessionPayload = {
      role: "admin",
      userId: "admin-1",
      email: "admin@ut.edu",
    };

    const req = new NextRequest("http://localhost:3000/login", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/admin");
  });

  it("allows access to /team for authenticated team session with teamId", () => {
    const session: SessionPayload = {
      role: "team",
      userId: "u-1",
      email: "leader@ut.edu",
      teamId: "team-1",
    };

    const req = new NextRequest("http://localhost:3000/team", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(200);
  });

  it("redirects /team to /login?redirect=/team when session is missing teamId", () => {
    const session: SessionPayload = {
      role: "team",
      userId: "u-1",
      email: "leader@ut.edu",
    };

    const req = new NextRequest("http://localhost:3000/team", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?redirect=/team");
  });

  it("redirects unauthenticated access to /team to /login?redirect=/team", () => {
    const req = new NextRequest("http://localhost:3000/team");
    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?redirect=/team");
  });

  it("redirects admin to /admin when attempting to access /team", () => {
    const session: SessionPayload = {
      role: "admin",
      userId: "admin-1",
      email: "admin@ut.edu",
    };

    const req = new NextRequest("http://localhost:3000/team", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/admin");
  });

  it("allows access to /admin for authenticated admin session", () => {
    const session: SessionPayload = {
      role: "admin",
      userId: "admin-1",
      email: "admin@ut.edu",
    };

    const req = new NextRequest("http://localhost:3000/admin", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(200);
  });

  it("redirects team member to /team when attempting to access /admin", () => {
    const session: SessionPayload = {
      role: "team",
      userId: "u-1",
      email: "leader@ut.edu",
      teamId: "team-1",
    };

    const req = new NextRequest("http://localhost:3000/admin", {
      headers: { cookie: createCookieHeader(session) },
    });

    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/team");
  });

  it("redirects unauthenticated browser access to /admin to /login?redirect=/admin", () => {
    const req = new NextRequest("http://localhost:3000/admin", {
      headers: { accept: "text/html,application/xhtml+xml" },
    });

    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?redirect=/admin");
  });

  it("returns 401 for unauthenticated non-html request to /admin", () => {
    const req = new NextRequest("http://localhost:3000/admin", {
      headers: { accept: "application/json" },
    });

    const res = proxy(req);

    expect(res.status).toBe(401);
  });

  it("redirects /register to /login", () => {
    const req = new NextRequest("http://localhost:3000/register");
    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
