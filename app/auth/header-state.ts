"use server";

import { resolveAccountState } from "@/lib/account/state";

export type HeaderMemberSnapshot =
  | { status: "signed_out" }
  | { status: "profile_incomplete" }
  | { status: "profile_complete"; username: string; displayName: string }
  | { status: "unavailable" };

// Resolve HttpOnly cookies on the server, using the same verified account path
// as /account. Never serialize the full account/profile or session to the header.
export async function getHeaderMemberState(): Promise<HeaderMemberSnapshot> {
  const account = await resolveAccountState();
  switch (account.status) {
    case "signed_out":
      return { status: "signed_out" };
    case "profile_incomplete":
      return { status: "profile_incomplete" };
    case "profile_complete":
      return {
        status: "profile_complete",
        username: account.profile.username,
        displayName: account.profile.displayName,
      };
    case "error":
      return { status: "unavailable" };
  }
}
