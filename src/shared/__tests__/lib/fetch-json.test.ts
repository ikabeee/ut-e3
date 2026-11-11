/**
 * @jest-environment node
 */
import { fetchJson } from "@shared/lib/fetch-json";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("fetchJson", () => {
  it("asks without the browser cache and returns the body the guard accepts", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ value: 3 }));

    expect(await fetchJson("/api/x", isValueBody)).toEqual({ value: 3 });
    expect(fetchSpy).toHaveBeenCalledWith("/api/x", { cache: "no-store" });
  });

  it("fails on an error status and on a body the guard refuses", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 503 }));

    await expect(fetchJson("/api/x", isValueBody)).rejects.toThrow("El servidor respondió 503.");

    jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ value: "3" }));

    await expect(fetchJson("/api/x", isValueBody)).rejects.toThrow("no es válida");
  });
});

function isValueBody(value: unknown): value is { value: number } {
  return typeof value === "object" && value !== null && "value" in value && typeof value.value === "number";
}
