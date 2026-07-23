export interface SupabaseWebConfig {
  projectUrl: string;
  publishableKey: string;
}

export function getSupabaseWebConfig(): SupabaseWebConfig {
  const projectUrl = process.env.SUPABASE_PROJECT_URL?.trim().replace(/\/+$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!projectUrl || !publishableKey) {
    throw new Error("La autenticación administrativa no está configurada.");
  }

  return { projectUrl, publishableKey };
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
