import { render, screen } from "@testing-library/react";
import { PassportView } from "@features/visitors/pages/passport-page";

const PASSPORT = { gamertag: "Neo", pin: "04217" };

const VISITS = { visitCount: 0, stands: [], tickets: [] };

describe("PassportView", () => {
  it("shows the gamertag and the PIN", () => {
    render(<PassportView passport={PASSPORT} visits={VISITS} />);

    expect(screen.getByText("Neo")).toBeInTheDocument();
    expect(screen.getByText("04217")).toBeInTheDocument();
  });

  it("shows what the page composes under the card, such as the tournament notice", () => {
    render(<PassportView passport={PASSPORT} visits={VISITS} extra={<p>Aviso del torneo</p>} />);

    expect(screen.getByText("Aviso del torneo")).toBeInTheDocument();
  });

  it("shows nothing extra when the page has nothing to add", () => {
    render(<PassportView passport={PASSPORT} visits={VISITS} />);

    expect(screen.queryByText("Aviso del torneo")).not.toBeInTheDocument();
  });
});
