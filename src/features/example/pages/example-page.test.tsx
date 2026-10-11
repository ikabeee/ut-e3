import { render, screen } from "@testing-library/react";
import { ExamplePage } from "@features/example/pages/example-page";

// Prueba de humo del scaffold: si la composición se rompe, falla aquí y no en silencio.
jest.mock("@features/example/lib/example-queries", () => ({
  getExampleMessage: async () => ({ title: "Feature de ejemplo", description: "Descripción de prueba" }),
}));

describe("ExamplePage", () => {
  it("renders the card with the message and the toggle", async () => {
    render(await ExamplePage());

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Feature de ejemplo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar detalles" })).toBeInTheDocument();
  });
});
