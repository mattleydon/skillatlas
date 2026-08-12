import AuthShell from "@/app/auth/components/auth-shell";

type AccountUnavailableProps = {
  configurationMissing?: boolean;
};

export default function AccountUnavailable({
  configurationMissing = false,
}: AccountUnavailableProps) {
  return (
    <AuthShell
      title="Account Unavailable"
      description="Public SkillAtlas pages remain available while account access is unavailable."
    >
      <div
        role="alert"
        className="rounded-sa-control border border-sa-negative/50 bg-sa-negative/8 px-sa-3 py-sa-3 text-sm leading-6 text-sa-text-primary"
      >
        {configurationMissing
          ? "Account access is not configured for this environment yet."
          : "We couldn't confirm your account right now. Please try again later."}
      </div>
    </AuthShell>
  );
}
