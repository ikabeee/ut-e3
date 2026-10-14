import { render } from "@testing-library/react";
import { GameDetailSkeleton } from "@features/games/components/game-detail-skeleton";

describe("GameDetailSkeleton", () => {
  it("renders an accessible hidden skeleton placeholder", () => {
    const { container } = render(<GameDetailSkeleton />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
