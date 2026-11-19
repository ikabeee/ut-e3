import { render, screen } from "@testing-library/react";
import { LogDetails } from "@features/admin/components/log-table-parts";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";

const COPY = ADMIN_COPY.logs;

describe("LogDetails", () => {
  it("shows the JSON as text: a value that looks like HTML is escaped, never rendered", () => {
    const { container } = render(
      <LogDetails text={JSON.stringify({ note: '<img src=x onerror="alert(1)">' }, null, 2)} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("pre")?.textContent).toContain('<img src=x onerror=\\"alert(1)\\">');
    expect(screen.getByText(COPY.showDetails)).toBeInTheDocument();
  });

  it("says there are no details when the entry has none", () => {
    render(<LogDetails text={null} />);

    expect(screen.getByText(COPY.noDetails)).toBeInTheDocument();
  });

  it("cuts a very long value and says so", () => {
    render(<LogDetails text={"x".repeat(5000)} />);

    expect(screen.getByText(COPY.detailsTruncated(4000))).toBeInTheDocument();
  });
});
