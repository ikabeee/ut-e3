import { render, screen } from "@testing-library/react";
import { TeamPortalPage, teamPortalPageMetadata } from "@features/teams/pages/team-portal-page";
import { TEAMS_COPY } from "@features/teams/lib/teams-copy";
import type { TeamPortalData } from "@features/teams/lib/types";

type AsyncComponent = (props: { deps?: unknown }) => Promise<React.JSX.Element | null>;

interface SuspensePropsWithAsyncChild {
  children: { type: AsyncComponent };
}

describe("TeamPortalPage", () => {
  it("exports metadata with noindex robots and correct copy", () => {
    expect(teamPortalPageMetadata.title).toBe(TEAMS_COPY.page.title);
    expect(teamPortalPageMetadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects to login with logout flag when there is no session", async () => {
    const mockRedirect = jest.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });

    const deps = {
      getSession: jest.fn().mockResolvedValue(null),
      redirectFn: mockRedirect,
    };

    const Page = TeamPortalPage({ deps });
    // SAFETY: Next.js Suspense wrapper exposes children with async component type.
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type({ deps })).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("redirects to login with logout flag when session role is not team", async () => {
    const mockRedirect = jest.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });

    const deps = {
      getSession: jest.fn().mockResolvedValue({
        role: "admin",
        userId: "u-1",
        email: "admin@ut.edu",
      }),
      redirectFn: mockRedirect,
    };

    const Page = TeamPortalPage({ deps });
    // SAFETY: Next.js Suspense wrapper exposes children with async component type.
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type({ deps })).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("redirects to login with logout flag when session has no teamId", async () => {
    const mockRedirect = jest.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });

    const deps = {
      getSession: jest.fn().mockResolvedValue({
        role: "team",
        userId: "u-2",
        email: "leader@ut.edu",
      }),
      redirectFn: mockRedirect,
    };

    const Page = TeamPortalPage({ deps });
    // SAFETY: Next.js Suspense wrapper exposes children with async component type.
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type({ deps })).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("redirects to login with logout flag when team was deleted by sysadmin (data is null)", async () => {
    const mockRedirect = jest.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });

    const deps = {
      getSession: jest.fn().mockResolvedValue({
        role: "team",
        userId: "u-2",
        email: "leader@ut.edu",
        teamId: "deleted-team-id",
      }),
      getPortalData: jest.fn().mockResolvedValue(null),
      redirectFn: mockRedirect,
    };

    const Page = TeamPortalPage({ deps });
    // SAFETY: Next.js Suspense wrapper exposes children with async component type.
    const content = (Page.props as SuspensePropsWithAsyncChild).children;

    await expect(content.type({ deps })).rejects.toThrow("NEXT_REDIRECT:/login?logout=true");
    expect(mockRedirect).toHaveBeenCalledWith("/login?logout=true");
  });

  it("renders TeamPortalView when team data exists", async () => {
    const mockData: TeamPortalData = {
      id: "team-1",
      name: "Equipo Alfa",
      standCode: "A1",
      scannerKey: null,
      totalCheckIns: 5,
      recentCheckIns: 2,
      game: null,
      members: [],
    };

    const deps = {
      getSession: jest.fn().mockResolvedValue({
        role: "team",
        userId: "u-2",
        email: "leader@ut.edu",
        teamId: "team-1",
      }),
      getPortalData: jest.fn().mockResolvedValue(mockData),
    };

    const Page = TeamPortalPage({ deps });
    // SAFETY: Next.js Suspense wrapper exposes children with async component type.
    const content = await (Page.props as SuspensePropsWithAsyncChild).children.type({ deps });

    // SAFETY: content is not null when session and team data exist.
    render(content!);
    expect(screen.getByRole("heading", { name: "Equipo Alfa" })).toBeInTheDocument();
  });

  it("uses TeamPortalLoading spinner as fallback", () => {
    const Page = TeamPortalPage();
    render(Page.props.fallback);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Cargando portal...")).not.toBeInTheDocument();
  });
});
