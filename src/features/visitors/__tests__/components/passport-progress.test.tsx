import { render, screen } from "@testing-library/react";
import { PassportProgress } from "@features/visitors/components/passport-progress";
import { getTicketProgress } from "@features/visitors/lib/passport-progress";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.passport.progress;

describe("PassportProgress", () => {
  it("tells how many visits are missing for the next ticket (RF-21)", () => {
    render(<PassportProgress progress={getTicketProgress(4)} />);

    expect(screen.getByText("Te faltan 5 visitas para tu siguiente boleto.")).toBeInTheDocument();
  });

  it("uses the singular when one visit is missing", () => {
    render(<PassportProgress progress={getTicketProgress(17)} />);

    expect(screen.getByText("Te faltan 1 visita para tu siguiente boleto.")).toBeInTheDocument();
  });

  it("exposes the progress as an accessible progress bar", () => {
    render(<PassportProgress progress={getTicketProgress(4)} />);

    const bar = screen.getByRole("progressbar", { name: COPY.label });

    expect(bar).toHaveAttribute("aria-valuenow", "44");
  });

  it("shows the completed message after the second ticket", () => {
    render(<PassportProgress progress={getTicketProgress(18)} />);

    expect(screen.getByText(COPY.complete)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: COPY.label })).toHaveAttribute("aria-valuenow", "100");
  });
});
