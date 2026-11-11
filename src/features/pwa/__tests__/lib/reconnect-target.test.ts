import { resolveReconnectTarget } from "@features/pwa/lib/reconnect-target";

describe("resolveReconnectTarget", () => {
  it("goes back to the page the visitor wanted", () => {
    expect(resolveReconnectTarget({ search: "?from=%2Fgames%2Fruta-9", fallback: "/passport" })).toBe("/games/ruta-9");
  });

  it("uses the fallback without a page to go back to", () => {
    expect(resolveReconnectTarget({ search: "", fallback: "/passport" })).toBe("/passport");
  });

  it.each(["https://evil.example/", "//evil.example", "javascript:alert(1)", "games", "/\\evil.example"])(
    "never leaves the site: %s",
    (from) => {
      const search = `?${new URLSearchParams({ from })}`;

      expect(resolveReconnectTarget({ search, fallback: "/passport" })).toBe("/passport");
    },
  );
});
