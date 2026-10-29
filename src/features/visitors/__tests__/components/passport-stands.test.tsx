import { render, screen } from "@testing-library/react";
import { PassportStands } from "@features/visitors/components/passport-stands";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.passport.stands;

const STANDS = [
  { code: "ZA-S1", visited: true },
  { code: "ZA-S2", visited: false },
  { code: "ZB-S1", visited: false },
];

describe("PassportStands", () => {
  it("lists every stand with its short code (RF-20, RF-11)", () => {
    render(<PassportStands stands={STANDS} />);

    expect(screen.getByText("ZA-S1")).toBeInTheDocument();
    expect(screen.getByText("ZA-S2")).toBeInTheDocument();
    expect(screen.getByText("ZB-S1")).toBeInTheDocument();
  });

  it("shows in text whether each stand was visited or is still missing", () => {
    render(<PassportStands stands={STANDS} />);

    expect(screen.getByText("ZA-S1").closest("li")).toHaveTextContent(COPY.visited);
    expect(screen.getByText("ZA-S2").closest("li")).toHaveTextContent(COPY.pending);
  });

  it("summarizes how many stands are visited", () => {
    render(<PassportStands stands={STANDS} />);

    expect(screen.getByText(COPY.summary(1, 3))).toBeInTheDocument();
  });
});
