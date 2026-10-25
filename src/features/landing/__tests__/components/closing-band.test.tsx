import { render, screen } from "@testing-library/react";
import { ClosingBand } from "@features/landing/components/closing-band";

describe("ClosingBand", () => {
  it("announces free admission with the event date and venue", () => {
    render(<ClosingBand dateLabel="20.11.2026" />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Entradalibre");
    expect(screen.getByText("20.11.2026 · UT Cancún")).toBeInTheDocument();
  });
});
