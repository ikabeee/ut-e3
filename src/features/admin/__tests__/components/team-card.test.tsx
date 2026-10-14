import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "@heroui/react";
import { TeamCard } from "@features/admin/components/team-card";
import { actionOk } from "@shared/lib/action-result";
import type { Team } from "@features/teams/lib/types";

const mockTeam: Team = {
  id: "team-uuid-1",
  name: "Equipo Grava",
  standCode: "A1",
  gameSlug: "grava-adventure",
  members: [
    {
      id: "member-uuid-1",
      teamId: "team-uuid-1",
      fullName: "Alex Rivera",
      email: "alex@example.com",
      groupName: "IDYGS101",
      isLeader: false,
      sortOrder: 0,
      isConfirmed: true,
    },
  ],
};

describe("TeamCard", () => {
  it("shows confirmation toast when deleting a team succeeds", async () => {
    const user = userEvent.setup();
    const successSpy = jest.spyOn(toast, "success").mockImplementation(() => "toast-id");
    const deleteTeamActionMock = jest.fn().mockResolvedValue(actionOk(undefined));

    render(<TeamCard team={mockTeam} actions={{ deleteTeam: deleteTeamActionMock }} />);

    const deleteTeamButton = screen.getByRole("button", { name: "Borrar" });
    await user.click(deleteTeamButton);

    const confirmButton = screen.getByRole("button", { name: "Sí, borrar" });
    await user.click(confirmButton);

    expect(deleteTeamActionMock).toHaveBeenCalledWith("team-uuid-1");
    expect(successSpy).toHaveBeenCalledWith("Equipo eliminado.");

    successSpy.mockRestore();
  });

  it("shows confirmation toast when removing a member succeeds", async () => {
    const user = userEvent.setup();
    const successSpy = jest.spyOn(toast, "success").mockImplementation(() => "toast-id");
    const deleteTeamMemberActionMock = jest.fn().mockResolvedValue(actionOk(mockTeam));

    render(<TeamCard team={mockTeam} actions={{ deleteTeamMember: deleteTeamMemberActionMock }} />);

    const removeMemberButton = screen.getByRole("button", { name: "Quitar" });
    await user.click(removeMemberButton);

    const confirmButton = screen.getByRole("button", { name: "Sí, borrar" });
    await user.click(confirmButton);

    expect(deleteTeamMemberActionMock).toHaveBeenCalledWith("member-uuid-1");
    expect(successSpy).toHaveBeenCalledWith("Integrante eliminado.");

    successSpy.mockRestore();
  });
});
