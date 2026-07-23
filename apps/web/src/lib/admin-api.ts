import { requireAdminBusiness } from "@/lib/admin-auth";

export interface AdminApiConfig {
  apiUrl: string;
  token: string;
  businessSlug: string;
  vertical: "barberia" | "belleza";
}

export async function getAuthenticatedAdminApiConfig(
  businessSlug: string,
): Promise<AdminApiConfig> {
  const { session, business } = await requireAdminBusiness(businessSlug);
  const apiUrl = process.env.VELORA_API_URL?.trim().replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("La conexión con Velora no está configurada.");
  }

  return {
    apiUrl,
    token: session.accessToken,
    businessSlug: business.businessSlug,
    vertical: business.vertical,
  };
}
