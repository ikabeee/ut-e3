import { isAdminAuthorization, isAdminRequest, matchesBasicCredentials } from "@shared/lib/server/admin-auth";

const basic = (credentials: string) => `Basic ${Buffer.from(credentials).toString("base64")}`;

describe("matchesBasicCredentials", () => {
  it("accepts the expected user and password", () => {
    expect(matchesBasicCredentials(basic("admin:s3cret"), "admin", "s3cret")).toBe(true);
  });

  it("rejects wrong or malformed credentials", () => {
    expect(matchesBasicCredentials(basic("admin:wrong"), "admin", "s3cret")).toBe(false);
    expect(matchesBasicCredentials(basic("nobody:s3cret"), "admin", "s3cret")).toBe(false);
    expect(matchesBasicCredentials(basic("admin"), "admin", "s3cret")).toBe(false);
    expect(matchesBasicCredentials("Bearer token", "admin", "s3cret")).toBe(false);
    expect(matchesBasicCredentials(null, "admin", "s3cret")).toBe(false);
  });

  it("allows a colon inside the password", () => {
    expect(matchesBasicCredentials(basic("admin:a:b"), "admin", "a:b")).toBe(true);
  });
});

describe("isAdminRequest", () => {
  const readHeaders = async () => new Headers({ authorization: basic("admin:s3cret") });

  it("denies every request when the credentials are not configured", async () => {
    await expect(isAdminRequest(null, readHeaders)).resolves.toBe(false);
  });

  it("checks the Authorization header against the configured credentials", async () => {
    await expect(isAdminRequest({ user: "admin", password: "s3cret" }, readHeaders)).resolves.toBe(true);
    await expect(isAdminRequest({ user: "admin", password: "other" }, readHeaders)).resolves.toBe(false);
  });
});

describe("isAdminAuthorization", () => {
  it("checks the header against the configured credentials and denies everything without them", () => {
    const credentials = { user: "admin", password: "s3cret" };

    expect(isAdminAuthorization(basic("admin:s3cret"), credentials)).toBe(true);
    expect(isAdminAuthorization(basic("admin:other"), credentials)).toBe(false);
    expect(isAdminAuthorization(basic("admin:s3cret"), null)).toBe(false);
  });
});
