export type AuthFlow = "sign-in" | "sign-up";

export const AUTH_EMAIL_COOKIE = "skillatlas-auth-email";
export const AUTH_FLOW_COOKIE = "skillatlas-auth-flow";
export const AUTH_RESEND_COOKIE = "skillatlas-auth-resend-after";
export const OTP_LENGTH = 6;
export const OTP_MAX_AGE_SECONDS = 10 * 60;
export const RESEND_COOLDOWN_SECONDS = 60;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/auth",
  maxAge: OTP_MAX_AGE_SECONDS,
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) return "your email address";

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"•".repeat(Math.max(3, Math.min(8, localPart.length - visible.length)))}@${domain}`;
}

export function isAuthFlow(value: string | undefined): value is AuthFlow {
  return value === "sign-in" || value === "sign-up";
}
