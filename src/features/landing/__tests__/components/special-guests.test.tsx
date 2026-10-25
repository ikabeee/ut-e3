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

  it("does not show the provisional role", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.queryByText("Ingeniera invitada")).not.toBeInTheDocument();
  });

  it("shows the role of a guest that has one", () => {
    const guest = { id: "guest-1", name: "Ana Pérez", role: "Ingeniera de software", talk: "Diseño de niveles" };

    render(<SpecialGuests guests={[guest]} />);

    expect(screen.getByText("Ingeniera de software")).toBeInTheDocument();
  });
});
