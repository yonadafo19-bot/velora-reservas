import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { adminCookieOptions, getSupabaseWebConfig } from "@/lib/supabase/config";

function isDevelopmentFallbackEnabled() {
  return process.env.NODE_ENV === "development"
    && process.env.VELORA_ENABLE_ADMIN_DEV_FALLBACK === "true"
    && Boolean(process.env.VELORA_ADMIN_DEV_TOKEN?.trim());
}

export async function updateAdminSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let authenticated = false;

  try {
    const config = getSupabaseWebConfig();
    const supabase = createServerClient(config.projectUrl, config.publishableKey, {
      cookieOptions: adminCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, ...adminCookieOptions });
          });
        },
      },
    });
    const { data, error } = await supabase.auth.getClaims();
    authenticated = !error && Boolean(data?.claims?.sub);
  } catch {
    authenticated = false;
  }

  if (!authenticated && !isDevelopmentFallbackEnabled()) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    redirectResponse.headers.set("Cache-Control", "private, no-store");
    return redirectResponse;
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
