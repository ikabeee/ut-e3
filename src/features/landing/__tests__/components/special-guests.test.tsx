import { render, screen } from "@testing-library/react";
import { SpecialGuests } from "@features/landing/components/special-guests";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

describe("SpecialGuests", () => {
  it("lists one card per guest under the section heading", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.getByRole("heading", { level: 2, name: "Invitadas especiales" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByText("Plática por anunciar")).toHaveLength(2);
  });
});
