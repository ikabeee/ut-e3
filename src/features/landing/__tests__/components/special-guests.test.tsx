import { render, screen } from "@testing-library/react";
import { SpecialGuests } from "@features/landing/components/special-guests";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

describe("SpecialGuests", () => {
  it("lists one card per guest under the section heading", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.getByRole("heading", { level: 2, name: "Invitadas especiales" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getAllByText("Plática por anunciar")).toHaveLength(1);
  });

  it("shows the photo of the guest with its alt text, and no decorative block", () => {
    const { container } = render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.getByRole("img", { name: SPECIAL_GUESTS[0]?.photo?.alt })).toHaveAttribute(
      "src",
      expect.stringContaining("ponente-1.webp"),
    );
    expect(container.querySelector('[aria-hidden="true"].bg-paper-rule')).toBeNull();
  });

  it("centers a single card in one column and keeps two columns for two cards", () => {
    const second = { id: "guest-2", name: "Por anunciar", talk: "Plática por anunciar" };
    const { rerender } = render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.getByRole("list")).toHaveClass("mx-auto", "grid-cols-1");

    rerender(<SpecialGuests guests={[...SPECIAL_GUESTS, second]} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("list")).toHaveClass("grid-cols-2");
  });

  it("shows a plain block, not an image, for a guest without photo", () => {
    const guest = { id: "guest-9", name: "Ana Pérez", talk: "Diseño de niveles" };
    const { container } = render(<SpecialGuests guests={[guest]} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"].bg-paper-rule')).not.toBeNull();
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
