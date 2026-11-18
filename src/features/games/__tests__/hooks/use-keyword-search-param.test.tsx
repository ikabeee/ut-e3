import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { useKeywordSearchParam } from "@features/games/hooks/use-keyword-search-param";

function renderProbe(search = "") {
  window.history.replaceState(null, "", `/games${search}`);
  render(
    <SearchParamsContext.Provider value={new URLSearchParams(search)}>
      <KeywordProbe />
    </SearchParamsContext.Provider>,
  );
}

function KeywordProbe() {
  const [keyword, clearKeyword] = useKeywordSearchParam();

  return (
    <div>
      <p role="status">{keyword === "" ? "none" : keyword}</p>
      <button type="button" onClick={clearKeyword}>
        Clear search
      </button>
    </div>
  );
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("useKeywordSearchParam", () => {
  it("reads the search text from ?q", () => {
    renderProbe("?q=cenote");

    expect(screen.getByRole("status")).toHaveTextContent("cenote");
  });

  it("is empty without ?q", () => {
    renderProbe();

    expect(screen.getByRole("status")).toHaveTextContent("none");
  });

  it("removes q from the URL, keeps the other params and pushes a history entry", async () => {
    const user = userEvent.setup();
    renderProbe("?genre=puzzle&q=cenote");
    const entries = window.history.length;

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(window.location.pathname).toBe("/games");
    expect(window.location.search).toBe("?genre=puzzle");
    expect(window.history).toHaveLength(entries + 1);
  });

  it("leaves a bare path when q was the only param", async () => {
    const user = userEvent.setup();
    renderProbe("?q=cenote");

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(window.location.search).toBe("");
  });
});
