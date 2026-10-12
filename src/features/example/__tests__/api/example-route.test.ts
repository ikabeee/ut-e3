/**
 * @jest-environment node
 */
import { GET } from "@features/example/api/example-route";

jest.mock("@features/example/lib/server/example-queries", () => ({
  getExampleMessage: async () => ({ title: "Feature de ejemplo", description: "Descripción de prueba" }),
}));

describe("GET (example)", () => {
  it("responds with the message as JSON", async () => {
    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      title: "Feature de ejemplo",
      description: "Descripción de prueba",
    });
  });
});
