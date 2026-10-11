import { render, screen } from "@testing-library/react";
import { OfflinePage, offlinePageMetadata } from "@features/offline/pages/offline-page";

describe("OfflinePage", () => {
  it("links to the sections that work without connection", () => {
    render(<OfflinePage />);

    expect(screen.getByRole("heading", { level: 1, name: "Estás sin conexión" })).toBeInTheDocument();
    const links = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(links).toEqual(["/", "/games", "/floor-plan"]);
  });

  it("is not indexed", () => {
    expect(offlinePageMetadata.robots).toEqual({ index: false, follow: false });
  });
});
