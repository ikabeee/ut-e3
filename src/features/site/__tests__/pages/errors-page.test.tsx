import { render, screen } from "@testing-library/react";
import { ErrorsPage, generateErrorsMetadata, generateErrorsStaticParams } from "@features/site/pages/errors-page";

const createProps = (type: string) => ({
  params: Promise.resolve({ type }),
  searchParams: Promise.resolve({}),
});

describe("ErrorsPage", () => {
  it("provides static params for all supported types", () => {
    expect(generateErrorsStaticParams()).toEqual([
      { type: "not-found" },
      { type: "404" },
      { type: "internal-server-error" },
      { type: "500" },
    ]);
  });

  it("generates metadata for not-found and server errors", async () => {
    await expect(generateErrorsMetadata(createProps("not-found"))).resolves.toMatchObject({
      title: "Página no encontrada",
      robots: { index: false },
    });

    await expect(generateErrorsMetadata(createProps("500"))).resolves.toMatchObject({
      title: "Algo salió mal",
      robots: { index: false },
    });

    await expect(generateErrorsMetadata(createProps("other"))).resolves.toEqual({});
  });

  it("renders NotFoundView when type is not-found or 404", async () => {
    const page = await ErrorsPage(createProps("not-found"));
    render(page);

    expect(screen.getByRole("heading", { level: 1, name: "Página no encontrada" })).toBeInTheDocument();
  });

  it("renders StandaloneErrorView when type is 500 or internal-server-error", async () => {
    const page = await ErrorsPage(createProps("500"));
    render(page);

    expect(screen.getByRole("heading", { level: 1, name: "Algo salió mal" })).toBeInTheDocument();
  });

  it("triggers notFound() when type is unsupported", async () => {
    await expect(ErrorsPage(createProps("unknown-error"))).rejects.toThrow();
  });
});
