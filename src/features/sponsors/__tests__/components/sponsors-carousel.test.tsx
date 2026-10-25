import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { NORTH_BYTE, PIXEL_FORGE, SPONSORS } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { SponsorsCarousel } from "@features/sponsors/components/sponsors-carousel";
import { SPONSORS_SECTION_ID } from "@features/sponsors/lib/sponsors-links";

const AUTOPLAY_MS = 6500;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function currentName() {
  return screen.getByRole("heading", { level: 2 });
}

function getSlides() {
  return screen
    .getAllByRole("group", { hidden: true })
    .filter((group) => group.getAttribute("aria-roledescription") === "diapositiva");
}

function getWebsiteLink() {
  return screen.getAllByRole("link").find((link) => link.getAttribute("target") === "_blank");
}

function advance(milliseconds: number) {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

function stubReducedMotion(isReduced: boolean) {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: isReduced && query === REDUCED_MOTION_QUERY,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

describe("SponsorsCarousel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders nothing when there are no sponsors", () => {
    const { container } = render(<SponsorsCarousel sponsors={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the sponsors section as a carousel", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    const section = screen.getByRole("region", { name: "Patrocinadores" });

    expect(section).toHaveAttribute("id", SPONSORS_SECTION_ID);
    expect(section).toHaveAttribute("aria-roledescription", "carrusel");
  });

  it("renders a slide with the logo of every sponsor", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    const slides = getSlides();

    expect(slides).toHaveLength(SPONSORS.length);
    SPONSORS.forEach((sponsor, index) => {
      expect(slides[index]).toHaveAccessibleName(sponsor.name);
      expect(within(slides[index]).getByRole("img", { hidden: true, name: sponsor.name })).toBeInTheDocument();
    });
  });

  it("renders a thumbnail for every sponsor and marks the first one as current", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    SPONSORS.forEach((sponsor, index) => {
      const thumbnail = screen.getByRole("button", { name: sponsor.name });

      expect(thumbnail).toHaveAttribute("aria-current", String(index === 0));
    });
  });

  it("shows the name and the services of the current sponsor", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    expect(currentName()).toHaveTextContent(PIXEL_FORGE.name);
    expect(screen.getByText(PIXEL_FORGE.services)).toBeInTheDocument();
    expect(screen.queryByText(NORTH_BYTE.services)).not.toBeInTheDocument();
  });

  it("links the website of the current sponsor in a new tab with a safe rel", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    const website = getWebsiteLink();

    expect(website).toHaveAttribute("href", PIXEL_FORGE.websiteUrl);
    expect(website).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links the phone of the current sponsor with a tel: href and a readable label", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    const phone = screen.getByRole("link", { name: "998 123 4567" });

    expect(phone).toHaveAttribute("href", "tel:+529981234567");
  });

  it("shows only the links of the current sponsor", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("moves to the next and previous sponsor and wraps around at both ends", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    fireEvent.click(screen.getByRole("button", { name: "Patrocinador anterior" }));
    expect(currentName()).toHaveTextContent("Code Lab");

    fireEvent.click(screen.getByRole("button", { name: "Patrocinador siguiente" }));
    expect(currentName()).toHaveTextContent("Pixel Forge");

    fireEvent.click(screen.getByRole("button", { name: "Patrocinador siguiente" }));
    expect(currentName()).toHaveTextContent("North Byte");
    expect(getWebsiteLink()).toHaveAttribute("href", NORTH_BYTE.websiteUrl);
    expect(screen.getByRole("link", { name: "998 765 4321" })).toHaveAttribute("href", "tel:+529987654321");
  });

  it("selects a sponsor from its thumbnail", () => {
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    fireEvent.click(screen.getByRole("button", { name: "Code Lab" }));

    expect(currentName()).toHaveTextContent("Code Lab");
    expect(screen.getByRole("button", { name: "Code Lab" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Pixel Forge" })).toHaveAttribute("aria-current", "false");
  });

  it("advances on its own after 6500 ms", () => {
    stubReducedMotion(false);
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    advance(AUTOPLAY_MS + 100);

    expect(currentName()).toHaveTextContent("North Byte");
  });

  it("does not advance on its own when the visitor prefers reduced motion", () => {
    stubReducedMotion(true);
    render(<SponsorsCarousel sponsors={SPONSORS} />);

    advance(AUTOPLAY_MS * 3);

    expect(currentName()).toHaveTextContent("Pixel Forge");
  });
});
