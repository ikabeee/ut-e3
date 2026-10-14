import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamPortalView } from "@features/teams/components/team-portal-view";
import type { TeamPortalData } from "@features/teams/lib/types";

jest.mock("@features/teams/lib/team-portal-actions", () => ({
  addMemberByLeaderAction: jest.fn(),
  deleteMemberByLeaderAction: jest.fn(),
  updateGameByLeaderAction: jest.fn(),
}));

jest.mock("@features/teams/lib/team-scanner-actions", () => ({
  recordTeamScanAction: jest.fn(),
}));

const mockPortalData: TeamPortalData = {
  id: "team-1",
  name: "Equipo Pixel",
  standCode: "B2",
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

    // Link to public site exists
    expect(screen.getAllByRole("link", { name: /ver sitio público/i })[0]).toHaveAttribute("href", "/");
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
});
