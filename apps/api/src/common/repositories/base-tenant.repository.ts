import type { TenantContext } from "../types/request-user";
import type { TenantWhere } from "./repository.types";
import { TenantScopeService } from "./tenant-scope.service";

export abstract class BaseTenantRepository {
  protected constructor(protected readonly tenantScope: TenantScopeService) {}

  protected requireTenant(): TenantContext {
    return this.tenantScope.requireTenantContext();
  }

  protected whereForTenant<T extends object>(
    where?: Omit<T, "businessId">,
  ): TenantWhere<T> {
    return this.tenantScope.tenantWhere(where);
  }
}
