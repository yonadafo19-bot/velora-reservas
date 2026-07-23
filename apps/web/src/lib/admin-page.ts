import { redirect } from "next/navigation";

import {
  requireAdminSession,
  resolveAuthorizedBusiness,
  toAdminNavigation,
} from "@/lib/admin-auth";

export async function getAdminPageContext(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
  path: string,
) {
  const params = await searchParams;
  const requestedBusiness = typeof params.negocio === "string" ? params.negocio : undefined;
  const session = await requireAdminSession(buildReturnTo(path, params));
  const resolved = resolveAuthorizedBusiness(session, requestedBusiness);

  if (!resolved.isCanonical) {
    const canonicalParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "negocio") {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => canonicalParams.append(key, entry));
      } else if (value !== undefined) {
        canonicalParams.set(key, value);
      }
    });
    canonicalParams.set("negocio", resolved.business.businessSlug);
    redirect(`${path}?${canonicalParams.toString()}`);
  }

  return {
    business: resolved.business,
    navigation: toAdminNavigation(session, resolved.business),
  };
}

function buildReturnTo(path: string, params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}
