import { EXAMPLE_API_PATH, fetchExampleMessage, parseExampleMessage } from "@features/example/api/example-api-client";

describe("example API client", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reads the message from the route handler", async () => {
    const message = { title: "Hola", description: "Una descripción" };
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => message });
    globalThis.fetch = fetchMock;

    await expect(fetchExampleMessage()).resolves.toEqual(message);
    expect(fetchMock).toHaveBeenCalledWith(EXAMPLE_API_PATH);
  });

  it("rejects a response without the expected fields", () => {
    expect(() => parseExampleMessage({ title: "Hola" })).toThrow("no tiene el formato esperado");
    expect(() => parseExampleMessage(null)).toThrow("no tiene el formato esperado");
  });
});
