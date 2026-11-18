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

    expect(screen.getByRole("heading", { level: 2, name: "Invitados especiales" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
    expect(screen.getByText("Plática por anunciar")).toBeInTheDocument();
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

  it("shows the role of a guest that has one", () => {
    const guest = { id: "guest-1", name: "Ana Pérez", role: "Ingeniera de software", talk: "Diseño de niveles" };

    render(<SpecialGuests guests={[guest]} />);

    expect(screen.getByText("Ingeniera de software")).toBeInTheDocument();
  });

  it("loads the shown photo eagerly and with the sizes of its slot, not the full file", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    const photo = screen.getByRole("img", { name: SPECIAL_GUESTS[0]?.photo?.alt });

    expect(photo).toHaveAttribute("loading", "eager");
    expect(photo).toHaveAttribute("sizes", "(min-width: 820px) 384px, 280px");
  });
});

describe("SpecialGuests without a pager (S35)", () => {
  it("has no pager: no buttons, no visible counter and no hint about swiping", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/Desliza o toca/)).toBeNull();
    expect(screen.queryByText("Pase 01 de 02")).toBeNull();
    expect(screen.queryByText("←")).toBeNull();
  });

  it("moves to the next badge with a tap on it and wraps around", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    swipe(getBadgeSurface(), { x: 100, y: 100 }, { x: 102, y: 101 });
    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);

    swipe(getBadgeSurface(), { x: 100, y: 100 }, { x: 102, y: 101 });
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
  });

  it("moves to the next badge with a swipe to the left and to the previous one with a swipe to the right", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    swipe(getBadgeSurface(), { x: 200, y: 100 }, { x: 80, y: 105 });
    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);

    swipe(getBadgeSurface(), { x: 80, y: 100 }, { x: 200, y: 98 });
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
  });

  it("does not move with a mostly vertical drag, which is the page scrolling", () => {
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    swipe(getBadgeSurface(), { x: 100, y: 100 }, { x: 60, y: 300 });

    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
  });

  it("makes the badge reachable with the keyboard, with a name for assistive technology", async () => {
    const user = userEvent.setup();
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    await user.tab();

    const carousel = screen.getByRole("group", { name: /Invitados especiales: usa las flechas/ });

    expect(carousel).toHaveFocus();
    expect(carousel).toBe(getBadgeSurface());
  });

  it("changes the badge with the arrow keys, wrapping around in both directions", async () => {
    const user = userEvent.setup();
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);

    await user.keyboard("{ArrowRight}");
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);

    await user.keyboard("{ArrowLeft}");
    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);
  });

  it("shows the next badge with Enter or Space and ignores other keys", async () => {
    const user = userEvent.setup();
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    await user.tab();
    await user.keyboard("a");
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);

    await user.keyboard("{Enter}");
    expect(getBadgeName()).toHaveTextContent(SECOND_GUEST_NAME);

    await user.keyboard(" ");
    expect(getBadgeName()).toHaveTextContent(FIRST_GUEST_NAME);
  });

  it("announces the badge that is shown politely, only to assistive technology", async () => {
    const user = userEvent.setup();
    render(<SpecialGuests guests={SPECIAL_GUESTS} />);

    const live = screen.getByText(`Pase 01 de 02: ${FIRST_GUEST_NAME}`);

    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveClass("sr-only");

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByText(`Pase 02 de 02: ${SECOND_GUEST_NAME}`)).toHaveAttribute("aria-live", "polite");
  });

  it("is not a control, and announces nothing, with a single guest", () => {
    const guest = { id: "guest-9", name: "Ana Pérez", talk: "Diseño de niveles" };
    render(<SpecialGuests guests={[guest]} />);

    expect(document.querySelector("[class*='touch-pan-y']")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
    expect(document.querySelector("[aria-live]")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
