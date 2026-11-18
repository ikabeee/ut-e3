import { render, screen } from "@testing-library/react";
import { ClosingBand } from "@features/landing/components/closing-band";

describe("ClosingBand", () => {
  it("announces free admission without the date and venue label", () => {
    const { container } = render(<ClosingBand />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Entradalibre");
    expect(container).not.toHaveTextContent("20.11.2026");
    expect(container).not.toHaveTextContent("UT Cancún");
  });
});
