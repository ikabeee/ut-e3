import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { TeamPortalPage, teamPortalPageMetadata } from "@features/teams/pages/team-portal-page";
import { getTeamPortalData } from "@features/teams/lib/server/team-portal-queries";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import type { TeamPortalData } from "@features/teams/lib/types";
import { getAuthSession } from "@shared/lib/server/session";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

jest.mock("@shared/lib/server/session", () => ({
  getAuthSession: jest.fn(),
}));

jest.mock("@features/teams/lib/server/team-portal-queries", () => ({
  getTeamPortalData: jest.fn(),
}));

jest.mock("@features/teams/components/team-portal-view", () => ({
  TeamPortalView: ({ data }: { data: TeamPortalData }) => (
    <div data-testid="team-portal-view">{data.name}</div>
  ),
}));

const mockGetAuthSession = getAuthSession as jest.MockedFunction<typeof getAuthSession>;
const mockGetTeamPortalData = getTeamPortalData as jest.MockedFunction<typeof getTeamPortalData>;
const mockRedirect = redirect as unknown as jest.Mock;

type AsyncComponent = () => Promise<React.JSX.Element>;

interface SuspensePropsWithAsyncChild {
  children: { type: AsyncComponent };
}

describe("TeamPortalPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports metadata with noindex robots and correct copy", () => {
    expect(teamPortalPageMetadata.title).toBe(TEAMS_COPY.page.title);
    expect(teamPortalPageMetadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects to login with logout flag when there is no session", async () => {
    mockGetAuthSession.mockResolvedValue(null);

    const Page = TeamPortalPage();
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type()).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("redirects to login with logout flag when session role is not team", async () => {
    mockGetAuthSession.mockResolvedValue({
      role: "admin",
      userId: "u-1",
      email: "admin@ut.edu",
    });

    const Page = TeamPortalPage();
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type()).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("redirects to login with logout flag when session has no teamId", async () => {
    mockGetAuthSession.mockResolvedValue({
      role: "team",
      userId: "u-2",
      email: "leader@ut.edu",
    });

    const Page = TeamPortalPage();
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type()).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("redirects to login with logout flag when team was deleted by sysadmin (data is null)", async () => {
    mockGetAuthSession.mockResolvedValue({
      role: "team",
      userId: "u-2",
      email: "leader@ut.edu",
      teamId: "deleted-team-id",
    });
    mockGetTeamPortalData.mockResolvedValue(null);

    const Page = TeamPortalPage();
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type()).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("renders TeamPortalView when team data exists", async () => {
    const mockData: TeamPortalData = {
      id: "team-1",
      name: "Equipo Alfa",
      standCode: "A1",
      totalCheckIns: 5,
      recentCheckIns: 2,
      game: null,
      members: [],
    };
    mockGetAuthSession.mockResolvedValue({
      role: "team",
      userId: "u-2",
      email: "leader@ut.edu",
      teamId: "team-1",
    });
    mockGetTeamPortalData.mockResolvedValue(mockData);

    const Page = TeamPortalPage();
    const content = await (Page.props as SuspensePropsWithAsyncChild).children.type();

    render(content);
    expect(screen.getByTestId("team-portal-view")).toHaveTextContent("Equipo Alfa");
  });

  it("uses TeamPortalLoading spinner as fallback", () => {
    const Page = TeamPortalPage();
    render(Page.props.fallback);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Cargando portal...")).not.toBeInTheDocument();
  });
});
