/**
 * @jest-environment node
 */
import {
  AUDIENCE_WINDOW_MS,
  getPublicBracketAudience,
  MAX_TRACKED,
  recordPublicBracketRequest,
} from "@features/tournament/lib/server/public-bracket-audience";

const START = Date.UTC(2026, 10, 14, 18, 0, 0);

function screen(address: string, agent = "Mozilla/5.0"): Request {
  return new Request("http://localhost/api/tournament/public", {
    headers: { "x-forwarded-for": address, "user-agent": agent },
  });
}

beforeEach(() => {
  const holder: typeof globalThis & { ute3PublicBracketAudience?: unknown } = globalThis;

  delete holder.ute3PublicBracketAudience;
});

describe("public bracket audience (RF-73)", () => {
  it("counts each screen once while it keeps polling, and forgets it after the window", () => {
    recordPublicBracketRequest(screen("phone-1"), START);
    recordPublicBracketRequest(screen("phone-1"), START + 3000);
    recordPublicBracketRequest(screen("phone-2"), START + 3000);

    expect(getPublicBracketAudience(START + 4000)).toEqual({ viewers: 2, requestsPerMinute: 3 });

    recordPublicBracketRequest(screen("phone-2"), START + 9000);

    expect(getPublicBracketAudience(START + 3000 + AUDIENCE_WINDOW_MS)).toEqual({ viewers: 1, requestsPerMinute: 4 });
    expect(getPublicBracketAudience(START + 61_000 + AUDIENCE_WINDOW_MS)).toEqual({ viewers: 0, requestsPerMinute: 0 });
  });

  it("stays bounded and fast under a flood of made-up addresses", () => {
    const flood = MAX_TRACKED * 4;
    const startedAt = performance.now();

    for (let index = 0; index < flood; index += 1) {
      recordPublicBracketRequest(screen(`made-up-${index}`), START + (index % 5000));
    }

    expect(getPublicBracketAudience(START + 5000).viewers).toBe(MAX_TRACKED);
    // Scanning the whole map on each request took several seconds for this many requests.
    expect(performance.now() - startedAt).toBeLessThan(2000);
  });
});
