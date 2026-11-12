import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpecialGuests } from "@features/landing/components/special-guests";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

const FIRST_GUEST_NAME = "Ing. Ariana Patricia Tzuc Vázquez";

const SECOND_GUEST_NAME = "Por anunciar";

function getBadgeName() {
  return screen.getByRole("heading", { level: 3 });
}

describe("SpecialGuests", () => {
  it("shows the section heading and one badge at a time, starting with the first guest", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.getByRole("heading", { level: 2, name: "Invitadas especiales" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
    expect(screen.getByText("Plática por anunciar")).toBeInTheDocument();
  });

  it("announces the counter politely", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.getByText("Pase 01 de 02")).toHaveAttribute("aria-live", "polite");
  });

  it("moves to the next badge and wraps around to the first one", async () => {
    const user = userEvent.setup();
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    await user.click(screen.getByRole("button", { name: "Pase siguiente" }));

    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);
    expect(screen.getByText("Pase 02 de 02")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pase siguiente" }));

    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
    expect(screen.getByText("Pase 01 de 02")).toBeInTheDocument();
  });

  it("moves to the previous badge and wraps around to the last one", async () => {
    const user = userEvent.setup();
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    await user.click(screen.getByRole("button", { name: "Pase anterior" }));

    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);
    expect(screen.getByText("Pase 02 de 02")).toBeInTheDocument();
  });

  it("shows the photo of a guest that has one, with its alt text", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.getByRole("img", { name: SPECIAL_GUESTS[0]?.photo?.alt })).toHaveAttribute(
      "src",
      expect.stringContaining("ponente-1.webp"),
    );
  });

  it("shows the placeholder, not an image, for a guest without photo", () => {
    const guest = { id: "guest-9", name: "Ana Pérez", talk: "Diseño de niveles" };
    render(<SpecialGuests guests={[guest]} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Por anunciar")).toBeInTheDocument();
  });

  it("does not show the controls nor the counter with a single guest", () => {
    const guest = { id: "guest-9", name: "Ana Pérez", talk: "Diseño de niveles" };
    render(<SpecialGuests guests={[guest]} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/^Pase \d+ de \d+$/)).toBeNull();
  });

  it("shows the role of a guest that has one", () => {
    const guest = { id: "guest-1", name: "Ana Pérez", role: "Ingeniera de software", talk: "Diseño de niveles" };

    render(<SpecialGuests guests={[guest]} />);

    expect(screen.getByText("Ingeniera de software")).toBeInTheDocument();
  });
});
