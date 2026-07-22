"use server";

import { redirect } from "next/navigation";

import {
  resolveAdminSessionFromAccessToken,
  sanitizeAdminNextPath,
} from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LOGIN_ERROR_PATH = "/admin/login?error=acceso";

export async function loginAdminAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const next = sanitizeAdminNextPath(formData.get("next"));

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    redirect(withNext(LOGIN_ERROR_PATH, next));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    const accessToken = data.session?.access_token;
    if (error || !accessToken) {
      redirect(withNext(LOGIN_ERROR_PATH, next));
    }

    const session = await resolveAdminSessionFromAccessToken(accessToken, "supabase");
    if (!session) {
      await supabase.auth.signOut({ scope: "local" });
      redirect(withNext(LOGIN_ERROR_PATH, next));
    }

    const defaultPath = `/admin?negocio=${encodeURIComponent(session.memberships[0].businessSlug)}`;
    redirect(next ?? defaultPath);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    redirect(withNext(LOGIN_ERROR_PATH, next));
  }
}

export async function logoutAdminAction() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  } finally {
    redirect("/admin/login");
  }
}

function withNext(path: string, next: string | null) {
  return next ? `${path}&next=${encodeURIComponent(next)}` : path;
}

function isNextRedirect(error: unknown) {
  if (error instanceof Error && error.message === "NEXT_REDIRECT") {
    return true;
  }

  return Boolean(error
    && typeof error === "object"
    && "digest" in error
    && typeof error.digest === "string"
    && error.digest.startsWith("NEXT_REDIRECT"));
}
