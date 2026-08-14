import "server-only";

import { resolveAccountState, type MemberProfile } from "@/lib/account/state";

export type ParticipationGate =
  | { status: "signed_out" }
  | { status: "profile_incomplete" }
  | { status: "allowed"; profile: MemberProfile }
  | { status: "future_ineligible"; reason: string }
  | { status: "error" };

export async function resolveParticipationGate(): Promise<ParticipationGate> {
  const account = await resolveAccountState();

  if (account.status === "signed_out") return { status: "signed_out" };
  if (account.status === "profile_incomplete") return { status: "profile_incomplete" };
  if (account.status === "profile_complete") {
    return { status: "allowed", profile: account.profile };
  }

  return { status: "error" };
}
