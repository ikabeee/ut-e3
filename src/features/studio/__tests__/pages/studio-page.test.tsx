import { render, screen } from "@testing-library/react";
import { makeGames } from "@features/games/__tests__/components/game-test-data";
import { StudioView, studioPageMetadata } from "@features/studio/pages/studio-page";

describe("StudioView", () => {
  beforeEach(() => {
    Element.prototype.scrollTo = () => undefined;
  });

  it("titles the page with the event name and shows every section", () => {
    render(<StudioView games={makeGames(3)} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("PIXEL & CODE");
    expect(screen.getByRole("heading", { level: 2, name: "Qué hacemos" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Lo que dicen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "EMPIEZA TU HISTORIA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("points its canonical URL to /studio", () => {
    expect(studioPageMetadata.alternates?.canonical).toBe("/studio");
  });
});
