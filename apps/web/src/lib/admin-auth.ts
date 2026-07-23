import { cache } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessVertical } from "@/types/demo";

const ADMIN_ROLES = new Set(["OWNER", "ADMIN"]);

export interface AdminMembership {
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessVertical: "BARBERSHOP" | "BEAUTY_STUDIO";
  role: "OWNER" | "ADMIN";
}

export interface AdminSession {
  userId: string;
  email: string;
  memberships: AdminMembership[];
  accessToken: string;
  source: "supabase" | "development";
}

export interface AdminBusinessContext {
  businessId: string;
  businessSlug: string;
  businessName: string;
  vertical: BusinessVertical;
  role: "OWNER" | "ADMIN";
}

interface AuthMeResponse {
  userId?: unknown;
  email?: unknown;
  memberships?: unknown;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await getSupabaseAdminSession();
  if (session) {
    return session;
  }

  return getDevelopmentAdminSession();
});

export async function requireAdminSession(returnTo = "/admin"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect(buildAdminLoginUrl(returnTo));
  }

  return session;
}

const getRequiredAdminBusiness = cache(async (businessSlug: string): Promise<{
  session: AdminSession;
  business: AdminBusinessContext;
}> => {
  const session = await requireAdminSession();
  const membership = session.memberships.find((item) => item.businessSlug === businessSlug);

  if (!membership) {
    redirect(`/admin?negocio=${encodeURIComponent(session.memberships[0].businessSlug)}`);
  }

  return {
    session,
    business: toBusinessContext(membership),
  };
});

export async function requireAdminBusiness(businessSlug: string): Promise<{
  session: AdminSession;
  business: AdminBusinessContext;
}> {
  return getRequiredAdminBusiness(businessSlug);
}

export function resolveAuthorizedBusiness(
  session: AdminSession,
  requestedBusiness?: string,
): { business: AdminBusinessContext; isCanonical: boolean } {
  const exact = requestedBusiness
    ? session.memberships.find((membership) => membership.businessSlug === requestedBusiness)
    : undefined;

  if (exact) {
    return { business: toBusinessContext(exact), isCanonical: true };
  }

  const aliasVertical = requestedBusiness === "barberia"
    ? "BARBERSHOP"
    : requestedBusiness === "belleza"
      ? "BEAUTY_STUDIO"
      : undefined;
  const aliasMatches = aliasVertical
    ? session.memberships.filter((membership) => membership.businessVertical === aliasVertical)
    : [];
  const membership = aliasMatches.length === 1 ? aliasMatches[0] : session.memberships[0];

  return { business: toBusinessContext(membership), isCanonical: false };
}

export function toAdminNavigation(session: AdminSession, current: AdminBusinessContext) {
  return {
    email: session.email,
    currentBusinessSlug: current.businessSlug,
    businesses: session.memberships.map((membership) => ({
      businessSlug: membership.businessSlug,
      businessName: membership.businessName,
      businessVertical: membership.businessVertical,
    })),
  };
}

export function sanitizeAdminNextPath(value: unknown): string | null {
  if (typeof value !== "string" || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value, "http://velora.local");
    const isAdminPath = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
    if (url.origin !== "http://velora.local"
      || !isAdminPath
      || url.pathname === "/admin/login"
      || url.pathname.startsWith("/admin/login/")) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function buildAdminLoginUrl(returnTo: string) {
  const safeReturnTo = sanitizeAdminNextPath(returnTo) ?? "/admin";
  return `/admin/login?next=${encodeURIComponent(safeReturnTo)}`;
}

export async function resolveAdminSessionFromAccessToken(
  accessToken: string,
  source: AdminSession["source"],
): Promise<AdminSession | null> {
  const apiUrl = process.env.VELORA_API_URL?.trim().replace(/\/+$/, "");
  if (!apiUrl || !accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as AuthMeResponse;
    const memberships = normalizeAdminMemberships(payload.memberships);
    if (typeof payload.userId !== "string" || typeof payload.email !== "string" || memberships.length === 0) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      memberships,
      accessToken,
      source,
    };
  } catch {
    return null;
  }
}

async function getSupabaseAdminSession(): Promise<AdminSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims?.sub) {
      return null;
    }

    const { data, error } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (error || !accessToken) {
      return null;
    }

    return resolveAdminSessionFromAccessToken(accessToken, "supabase");
  } catch {
    return null;
  }
}

async function getDevelopmentAdminSession(): Promise<AdminSession | null> {
  if (process.env.NODE_ENV !== "development"
    || process.env.VELORA_ENABLE_ADMIN_DEV_FALLBACK !== "true") {
    return null;
  }

  const token = process.env.VELORA_ADMIN_DEV_TOKEN?.trim();
  return token ? resolveAdminSessionFromAccessToken(token, "development") : null;
}

function normalizeAdminMemberships(value: unknown): AdminMembership[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): AdminMembership[] => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const membership = entry as Record<string, unknown>;
    if (typeof membership.businessId !== "string"
      || typeof membership.businessSlug !== "string"
      || typeof membership.businessName !== "string"
      || (membership.businessVertical !== "BARBERSHOP" && membership.businessVertical !== "BEAUTY_STUDIO")
      || typeof membership.role !== "string"
      || !ADMIN_ROLES.has(membership.role)) {
      return [];
    }

    return [{
      businessId: membership.businessId,
      businessSlug: membership.businessSlug,
      businessName: membership.businessName,
      businessVertical: membership.businessVertical,
      role: membership.role as "OWNER" | "ADMIN",
    }];
  });
}

function toBusinessContext(membership: AdminMembership): AdminBusinessContext {
  return {
    businessId: membership.businessId,
    businessSlug: membership.businessSlug,
    businessName: membership.businessName,
    vertical: membership.businessVertical === "BARBERSHOP" ? "barberia" : "belleza",
    role: membership.role,
  };
}
