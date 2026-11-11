import { render, screen } from "@testing-library/react";
import { PassportCard } from "@features/visitors/components/passport-card";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

describe("PassportCard", () => {
  it("renders PIN and gamertag", () => {
    render(<PassportCard passport={{ gamertag: "PlayerOne", pin: "12345" }} />);

    expect(screen.getByText("PlayerOne")).toBeInTheDocument();
    const pinElement = screen.getByText("12345");
    expect(pinElement).toBeInTheDocument();
    expect(pinElement).toHaveClass("type-mono");
    expect(screen.getByText(VISITORS_COPY.passport.gamertagLabel)).toBeInTheDocument();
    expect(screen.getByText(VISITORS_COPY.passport.pinLabel)).toBeInTheDocument();
  });
});
