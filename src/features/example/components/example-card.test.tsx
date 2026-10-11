import { render, screen } from "@testing-library/react";
import { ExampleCard } from "@features/example/components/example-card";

describe("ExampleCard", () => {
  it("renders the message it receives", () => {
    render(<ExampleCard message={{ title: "Hola", description: "Una descripción" }} />);

    expect(screen.getByRole("heading", { name: "Hola" })).toBeInTheDocument();
    expect(screen.getByText("Una descripción")).toBeInTheDocument();
  });
});
