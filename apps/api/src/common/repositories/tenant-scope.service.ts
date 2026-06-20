import { ForbiddenException, Injectable } from "@nestjs/common";

import type { TenantContext } from "../types/request-user";
import { TenantContextService } from "../../tenancy/tenant-context.service";
import type { TenantWhere } from "./repository.types";

@Injectable()
export class TenantScopeService {
  constructor(private readonly tenantContext: TenantContextService) {}

  requireTenantContext(): TenantContext {
    const tenant = this.tenantContext.get();
    if (!tenant) {
      throw new ForbiddenException({
        code: "TENANT_CONTEXT_REQUIRED",
        message: "Se requiere un contexto tenant autorizado.",
      });
    }

    return tenant;
  }

  assertSameBusinessId(businessId: string | undefined): string {
    const tenant = this.requireTenantContext();
    if (!businessId || businessId !== tenant.businessId) {
      throw new ForbiddenException({
        code: "TENANT_BUSINESS_MISMATCH",
        message: "El recurso no pertenece al negocio autorizado.",
      });
    }

    return tenant.businessId;
  }

  tenantWhere<T extends object>(where?: Omit<T, "businessId">): TenantWhere<T> {
    const tenant = this.requireTenantContext();
    return {
      ...where,
      businessId: tenant.businessId,
    } as TenantWhere<T>;
  }
}
