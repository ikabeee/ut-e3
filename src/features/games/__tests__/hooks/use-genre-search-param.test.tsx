import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { useGenreSearchParam } from "@features/games/hooks/use-genre-search-param";

function renderProbe(search = "") {
  render(
    <SearchParamsContext.Provider value={new URLSearchParams(search)}>
      <GenreProbe />
    </SearchParamsContext.Provider>,
  );
}

function GenreProbe() {
  const [genreSlug, setGenreSlug] = useGenreSearchParam();

  return (
    <div>
      <p role="status">{genreSlug ?? "none"}</p>
      <button type="button" onClick={() => setGenreSlug("puzzle")}>
        Pick puzzle
      </button>
      <button type="button" onClick={() => setGenreSlug(null)}>
        Clear genre
      </button>
    </div>
  );
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("useGenreSearchParam", () => {
  it("pushes a history entry when a genre is chosen, so Back returns to the unfiltered catalog", async () => {
    const user = userEvent.setup();
    renderProbe();
    const entries = window.history.length;

    await user.click(screen.getByRole("button", { name: "Pick puzzle" }));

    expect(window.location.search).toContain("genre=puzzle");
    expect(window.history).toHaveLength(entries + 1);
  });

  it("pushes a history entry when the filter is cleared", async () => {
    const user = userEvent.setup();
    renderProbe("genre=puzzle");
    const entries = window.history.length;

    await user.click(screen.getByRole("button", { name: "Clear genre" }));

    expect(window.location.search).not.toContain("genre=");
    expect(window.history).toHaveLength(entries + 1);
  });

  it("keeps reading the genre from the URL as the source of truth", () => {
    renderProbe("genre=puzzle");

    expect(screen.getByRole("status")).toHaveTextContent("puzzle");
  });
});
