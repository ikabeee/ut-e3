import {
  disableAccountAction,
  inviteAccountAction,
  reactivateAccountAction,
  resendInvitationAction,
} from "@features/accounts/lib/management-actions";

// The four actions of the accounts panel; the pages of the sysadmin and of the KOF administrator pass them to it.
export const ACCOUNT_ACTIONS = {
  invite: inviteAccountAction,
  resend: resendInvitationAction,
  disable: disableAccountAction,
  reactivate: reactivateAccountAction,
};
