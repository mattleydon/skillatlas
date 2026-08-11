"use server";

import type { AuthError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthActionState } from "@/app/auth/action-state";
import { ROUTES } from "@/constants/routes";
import {
  AUTH_COOKIE_OPTIONS,
  AUTH_EMAIL_COOKIE,
  AUTH_FLOW_COOKIE,
  AUTH_RESEND_COOKIE,
  isAuthFlow,
  isValidEmail,
  normalizeEmail,
  OTP_LENGTH,
  RESEND_COOLDOWN_SECONDS,
  type AuthFlow,
} from "@/lib/auth/otp";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const CONFIGURATION_ERROR: AuthActionState = {
  status: "error",
  message: "Account access is not configured for this environment yet.",
};

const UNAVAILABLE_ERROR: AuthActionState = {
  status: "error",
  message: "Account access is temporarily unavailable. Please try again later.",
};

function emailError(): AuthActionState {
  return {
    status: "error",
    message: "Enter a valid email address.",
    field: "email",
  };
}

function requestError(error: AuthError): AuthActionState {
  if (error.status === 429 || error.code?.includes("rate_limit")) {
    return {
      status: "error",
      message: "Please wait before requesting another code.",
    };
  }

  return {
    status: "error",
    message: "We couldn't send a code. Check the address and try again.",
  };
}

function isUnknownSignInAccount(error: AuthError, flow: AuthFlow) {
  return flow === "sign-in" && error.status === 422 && error.code === "otp_disabled";
}

function verificationError(error: AuthError): AuthActionState {
  if (error.code?.includes("expired")) {
    return {
      status: "error",
      message: "That code has expired. Request a new code and try again.",
      field: "token",
    };
  }

  return {
    status: "error",
    message: "We couldn't verify that code. Request a new code and try again.",
    field: "token",
  };
}

async function setPendingAuth(email: string, flow: AuthFlow) {
  const cookieStore = await cookies();
  const resendAt = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;

  cookieStore.set(AUTH_EMAIL_COOKIE, email, AUTH_COOKIE_OPTIONS);
  cookieStore.set(AUTH_FLOW_COOKIE, flow, AUTH_COOKIE_OPTIONS);
  cookieStore.set(AUTH_RESEND_COOKIE, String(resendAt), AUTH_COOKIE_OPTIONS);
}

async function clearPendingAuth() {
  const cookieStore = await cookies();
  const expiredOptions = { ...AUTH_COOKIE_OPTIONS, maxAge: 0 };

  cookieStore.set(AUTH_EMAIL_COOKIE, "", expiredOptions);
  cookieStore.set(AUTH_FLOW_COOKIE, "", expiredOptions);
  cookieStore.set(AUTH_RESEND_COOKIE, "", expiredOptions);
}

async function requestCode(flow: AuthFlow, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidEmail(email)) return emailError();

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: flow === "sign-up" },
    });

    if (error && !isUnknownSignInAccount(error, flow)) return requestError(error);
  } catch (error) {
    return error instanceof SupabaseConfigurationError ? CONFIGURATION_ERROR : UNAVAILABLE_ERROR;
  }

  await setPendingAuth(email, flow);
  redirect(`${ROUTES.authVerify}?requested=1`);
}

export async function requestSignInCodeAction(
  _previousState: AuthActionState,
  formData: FormData
) {
  return requestCode("sign-in", formData);
}

export async function requestSignUpCodeAction(
  _previousState: AuthActionState,
  formData: FormData
) {
  return requestCode("sign-up", formData);
}

export async function verifyCodeAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const cookieStore = await cookies();
  const email = cookieStore.get(AUTH_EMAIL_COOKIE)?.value ?? "";

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Request a new code before continuing.",
      field: "token",
    };
  }

  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(token)) {
    return {
      status: "error",
      message: `Enter the ${OTP_LENGTH}-digit code from your email.`,
      field: "token",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

    if (error) return verificationError(error);
  } catch (error) {
    return error instanceof SupabaseConfigurationError ? CONFIGURATION_ERROR : UNAVAILABLE_ERROR;
  }

  await clearPendingAuth();
  redirect(ROUTES.account);
}

export async function resendCodeAction(
  previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  void previousState;
  void formData;
  const cookieStore = await cookies();
  const email = cookieStore.get(AUTH_EMAIL_COOKIE)?.value ?? "";
  const flowValue = cookieStore.get(AUTH_FLOW_COOKIE)?.value;
  const resendAfter = Number(cookieStore.get(AUTH_RESEND_COOKIE)?.value ?? 0);

  if (!isValidEmail(email) || !isAuthFlow(flowValue)) {
    return {
      status: "error",
      message: "Start a new sign-in or sign-up request first.",
    };
  }

  if (Number.isFinite(resendAfter) && resendAfter > Date.now()) {
    const seconds = Math.max(1, Math.ceil((resendAfter - Date.now()) / 1000));
    return {
      status: "error",
      message: `Please wait ${seconds} seconds before requesting another code.`,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: flowValue === "sign-up" },
    });

    if (error && !isUnknownSignInAccount(error, flowValue)) return requestError(error);
  } catch (error) {
    return error instanceof SupabaseConfigurationError ? CONFIGURATION_ERROR : UNAVAILABLE_ERROR;
  }

  await setPendingAuth(email, flowValue);

  return {
    status: "success",
    message: "A new code has been requested. Check your local Mailpit inbox or email.",
  };
}

export async function signOutAction() {
  let failed = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    failed = Boolean(error);
  } catch {
    failed = true;
  }

  redirect(failed ? `${ROUTES.account}?authError=sign-out` : ROUTES.authSignIn);
}
