import { render, screen } from "@testing-library/react";
import { PassportStands } from "@features/visitors/components/passport-stands";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.passport.stands;

// The game names travel with the stands: a literal variable (not an inline literal) keeps the new field without
// changing the shape the component declares today.
const STANDS = [
  { code: "ZA-S1", visited: true, gameName: "Pixel Quest" },
  { code: "ZA-S2", visited: false, gameName: "Marea Neón" },
];

// S5: the passport stand grid shows the game name under each stand code (audit H6-1).
describe("PassportStands game names (S5)", () => {
  it("shows the game name under each stand code", () => {
    render(<PassportStands stands={STANDS} />);

    expect(screen.getByText("Pixel Quest")).toBeInTheDocument();
    expect(screen.getByText("Marea Neón")).toBeInTheDocument();
  });

  it("still lists every stand with its short code", () => {
    render(<PassportStands stands={STANDS} />);

    expect(screen.getByText("ZA-S1")).toBeInTheDocument();
    expect(screen.getByText("ZA-S2")).toBeInTheDocument();
    expect(screen.getByText(COPY.summary(1, 2))).toBeInTheDocument();
  });
});
