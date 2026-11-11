/** A command that breaks a tournament rule; its message is safe to show to the staff. */
export class TournamentRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TournamentRuleError";
  }
}
