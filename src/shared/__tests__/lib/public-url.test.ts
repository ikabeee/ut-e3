import { buildPublicUrl } from "@shared/lib/public-url";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("buildPublicUrl", () => {
  it("uses the public origin and keeps the path and the fragment", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://showcase.example.com";

    expect(buildPublicUrl("/passport/recover/confirm#abc", "http://localhost:3000/x").href).toBe(
      "https://showcase.example.com/passport/recover/confirm#abc",
    );
  });

  it("falls back to the origin of the request when there is no public one", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    expect(buildPublicUrl("/login", "http://localhost:3000/admin").href).toBe("http://localhost:3000/login");
    expect(buildPublicUrl("/login", new URL("http://localhost:3000/admin")).href).toBe("http://localhost:3000/login");
  });

  it.each(["", "  ", "esto no es una url", "ftp://showcase.example.com", "https://showcase.example.com/"])(
    "falls back to the origin of the request for the value %p, instead of failing every redirect",
    (value) => {
      process.env.NEXT_PUBLIC_SITE_URL = value;

      expect(buildPublicUrl("/login", "http://localhost:3000/admin").origin).toBe("http://localhost:3000");
    },
  );
});
