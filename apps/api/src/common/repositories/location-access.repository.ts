import { ForbiddenException, Injectable } from "@nestjs/common";

import type { PrismaTransaction } from "../database/prisma-transaction";
import { TenantScopeService } from "./tenant-scope.service";

@Injectable()
export class LocationAccessRepository {
  constructor(private readonly tenantScope: TenantScopeService) {}

  async assertLocationBelongsToBusiness(
    transaction: PrismaTransaction,
    locationId: string,
  ): Promise<{ id: string; businessId: string }> {
    const where = this.tenantScope.tenantWhere({ id: locationId });
    const location = await transaction.location.findFirst({
      where,
      select: { id: true, businessId: true },
    });

    if (!location) {
      throw new ForbiddenException({
        code: "TENANT_LOCATION_ACCESS_DENIED",
        message: "La sucursal no pertenece al negocio autorizado.",
      });
    }

    return location;
  }
}
