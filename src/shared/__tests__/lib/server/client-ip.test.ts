/**
 * @jest-environment node
 */
import { readClientIp } from "@shared/lib/server/client-ip";

describe("readClientIp", () => {
  it("keeps the hop our proxy appended and ignores the ones the client made up", () => {
    expect(readClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("reads a single hop, the one Caddy or next start sets", () => {
    expect(readClientIp(new Headers({ "x-forwarded-for": " 198.51.100.7 " }))).toBe("198.51.100.7");
  });

  it("ignores empty hops and falls back to unknown without the header", () => {
    expect(readClientIp(new Headers({ "x-forwarded-for": "198.51.100.7, " }))).toBe("198.51.100.7");
    expect(readClientIp(new Headers())).toBe("unknown");
  });
});
