import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabasePublicConfig,
  SUPABASE_AUTH_COOKIE_OPTIONS,
  SupabaseConfigurationError,
} from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const { url, anonKey } = getSupabasePublicConfig();
    const supabase = createServerClient<Database>(url, anonKey, {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getClaims();
  } catch (error) {
    if (!(error instanceof SupabaseConfigurationError)) {
      // Auth failures remain scoped to Auth/account routes. Public pages never
      // pass through this helper, and route UI handles unavailable states.
    }
  }

  return response;
}
