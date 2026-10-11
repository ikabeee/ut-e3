import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExampleToggle } from "@features/example/components/example-toggle";

describe("ExampleToggle", () => {
  it("shows and hides the details on every press", async () => {
    const user = userEvent.setup();
    render(<ExampleToggle />);

    const button = screen.getByRole("button", { name: "Mostrar detalles" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(screen.getByRole("button", { name: "Ocultar detalles" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/useToggle/)).toBeVisible();

    await user.click(button);
    expect(screen.getByRole("button", { name: "Mostrar detalles" })).toHaveAttribute("aria-expanded", "false");
  });
});
