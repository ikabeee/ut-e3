import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamPortalView } from "@features/teams/components/team-portal-view";
import type { TeamPortalData } from "@features/teams/lib/types";

const mockPortalData: TeamPortalData = {
  id: "team-1",
  name: "Equipo Pixel",
  standCode: "B2",
  scannerKey: "stand-scanner-key-xyz",
  totalCheckIns: 42,
  recentCheckIns: 5,
  game: {
    id: "game-1",
    name: "Pixel Quest",
    slug: "pixel-quest",
    description: "Un juego de aventura en píxeles.",
    itchioUrl: "https://pixel.itch.io",
  },
  members: [
    {
      id: "member-1",
      fullName: "Líder Mario",
      email: "mario@example.com",
      groupName: "IDYGS101",
      isLeader: true,
    },
  ],
};

describe("TeamPortalView", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("renders sidebar with team details and defaults to overview", () => {
    render(<TeamPortalView data={mockPortalData} />);

    // Sidebar branding and team info
    expect(screen.getAllByText("Equipo Pixel")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/stand b2/i)[0]).toBeInTheDocument();

    // Default overview section content
    expect(screen.getByText("Total de Visitas Registradas")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    // Sidebar navigation buttons exist
    expect(screen.getAllByRole("button", { name: /escáner qr/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /integrantes/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /ficha del juego/i })[0]).toBeInTheDocument();

    // "Ver sitio público" should NOT exist
    expect(screen.queryByText(/ver sitio público/i)).not.toBeInTheDocument();

    // Logout button exists
    expect(screen.getAllByRole("button", { name: /cerrar sesión/i })[0]).toBeInTheDocument();
  });

  it("switches section when sidebar button is clicked", async () => {
    const user = userEvent.setup();

    render(<TeamPortalView data={mockPortalData} />);

    // Click on "Integrantes" in sidebar
    const membersNavButton = screen.getAllByRole("button", { name: /integrantes/i })[0];
    await user.click(membersNavButton);

    // Integrantes section should now be visible
    expect(screen.getByText("Líder Mario")).toBeInTheDocument();
  });

  it("displays scanner key in overview and copies to clipboard when button is clicked", async () => {
    const user = userEvent.setup();
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
      },
    });

    render(<TeamPortalView data={mockPortalData} />);

    expect(screen.getByText("Llave de Escáner de tu Stand")).toBeInTheDocument();
    expect(screen.getByText("stand-scanner-key-xyz")).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: /copiar llave/i });
    expect(copyButton).toBeInTheDocument();

    await user.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith("stand-scanner-key-xyz");
    expect(await screen.findByRole("button", { name: /¡llave copiada al portapapeles!/i })).toBeInTheDocument();
  });
});
