import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { adminCookieOptions, getSupabaseWebConfig } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const config = getSupabaseWebConfig();

  return createServerClient(config.projectUrl, config.publishableKey, {
    cookieOptions: adminCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, ...adminCookieOptions });
          });
        } catch {
          // Los Server Components no pueden escribir cookies. El proxy las refresca.
        }
      },
    },
  });
}
