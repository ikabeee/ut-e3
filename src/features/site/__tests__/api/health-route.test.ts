/**
 * @jest-environment node
 */
import { GET } from "@features/site/api/health-route";

describe("GET /api/health", () => {
  it("answers 200 with an ok status", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("is never cached, so the check always reaches the server", async () => {
    expect((await GET()).headers.get("Cache-Control")).toBe("no-store");
  });
});
