import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { StandTrafficBadge } from "@features/visitors/components/stand-traffic-badge";
import { visitorsQueryKeys } from "@features/visitors/lib/visitors-query-options";

function renderBadge(standCode: string) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(visitorsQueryKeys.standTraffic(), {
    windowMinutes: 15,
    stands: [
      { standCode: "A1", recentCheckIns: 2 },
      { standCode: "B7", recentCheckIns: 12 },
    ],
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StandTrafficBadge standCode={standCode} />
    </QueryClientProvider>,
  );
}

describe("StandTrafficBadge", () => {
  it("shows the traffic level of the stand", () => {
    renderBadge("B7");

    expect(screen.getByText("Mucha afluencia · 12 en 15 min")).toBeInTheDocument();
  });

  it("shows nothing for a stand without a game", () => {
    const { container } = renderBadge("C1");

    expect(container).toBeEmptyDOMElement();
  });
});
