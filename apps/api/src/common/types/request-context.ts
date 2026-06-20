import type { RequestUser, TenantContext } from "./request-user";

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string | undefined>;
  user?: RequestUser;
  tenant?: TenantContext;
}
