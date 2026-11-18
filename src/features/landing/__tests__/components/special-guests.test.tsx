import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpecialGuests } from "@features/landing/components/special-guests";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";

const FIRST_GUEST_NAME = "Ing. Ariana Patricia Tzuc Vázquez";

const SECOND_GUEST_NAME = "Ing. Noelí Rodríguez Morales";

function getBadgeSurface() {
  const surface = getBadgeName().closest("[class*='touch-pan-y']");

  if (!(surface instanceof HTMLElement)) throw new Error("The badge is not a swipe surface");

  return surface;
}

function getBadgeName() {
  return screen.getByRole("heading", { level: 3 });
}

function swipe(surface: HTMLElement, from: { x: number; y: number }, to: { x: number; y: number }) {
  fireEvent.pointerDown(surface, { button: 0, clientX: from.x, clientY: from.y });
  fireEvent.pointerUp(surface, { button: 0, clientX: to.x, clientY: to.y });
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

  it("keeps the pager beside the badge, not under the heading", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} isLanding />);

    const heading = screen.getByRole("heading", { level: 2, name: "Invitadas especiales" });
    const next = screen.getByRole("button", { name: "Pase siguiente" });
    const surface = getBadgeSurface();

    expect(surface.parentElement).toContainElement(next);
    expect(surface.parentElement).not.toContainElement(heading);
  });

  it("hints that the badge can be moved", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} isLanding />);

    expect(screen.getByText("Desliza o toca el pase para ver el siguiente")).toBeInTheDocument();
  });

  it("moves to the next badge with a tap on it", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} isLanding />);

    swipe(getBadgeSurface(), { x: 100, y: 100 }, { x: 102, y: 101 });

    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);
  });

  it("moves to the next badge with a swipe to the left and to the previous one with a swipe to the right", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} isLanding />);

    swipe(getBadgeSurface(), { x: 200, y: 100 }, { x: 80, y: 105 });
    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);

    swipe(getBadgeSurface(), { x: 80, y: 100 }, { x: 200, y: 98 });
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
    expect(screen.getByText("Pase 01 de 02")).toBeInTheDocument();
  });

  it("does not move with a mostly vertical drag, which is the page scrolling", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} isLanding />);

    swipe(getBadgeSurface(), { x: 100, y: 100 }, { x: 60, y: 300 });

    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
  });

  it("is not a swipe surface with a single guest", () => {
    const guest = { id: "guest-9", name: "Ana Pérez", talk: "Diseño de niveles" };
    render(<SpecialGuests guests={[guest]} isLanding />);

    expect(document.querySelector("[class*='touch-pan-y']")).toBeNull();
    expect(screen.queryByText(/Desliza o toca/)).toBeNull();
  });

  it("loads the shown photo eagerly and with the sizes of its slot, not the full file", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} isLanding />);

    const photo = screen.getByRole("img", { name: SPECIAL_GUESTS[0]?.photo?.alt });

    expect(photo).toHaveAttribute("loading", "eager");
    expect(photo).toHaveAttribute("sizes", "(min-width: 820px) 384px, 280px");
  });
});

describe("SpecialGuests without isLanding (/showcase, S26)", () => {
  it("keeps the controls under the heading, with no hint and a plain badge", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    const heading = screen.getByRole("heading", { level: 2, name: "Invitadas especiales" });
    const next = screen.getByRole("button", { name: "Pase siguiente" });

    expect(heading.parentElement).toContainElement(next);
    expect(screen.queryByText(/Desliza o toca/)).not.toBeInTheDocument();
    expect(document.querySelector("[class*='touch-pan-y']")).toBeNull();
  });

  it("does not move with a tap on the badge", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    const surface = getBadgeName().closest("[class*='grid']");

    if (!(surface instanceof HTMLElement)) throw new Error("The badge has no stage");

    swipe(surface, { x: 100, y: 100 }, { x: 101, y: 100 });

    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
  });

  it("loads the photo with the sizes of the whole badge and without the eager loading", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    const photo = screen.getByRole("img", { name: SPECIAL_GUESTS[0]?.photo?.alt });

    expect(photo).toHaveAttribute("sizes", "(min-width: 820px) 440px, 320px");
    expect(photo).not.toHaveAttribute("loading", "eager");
  });
});
