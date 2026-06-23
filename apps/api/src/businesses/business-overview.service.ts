import { Injectable } from "@nestjs/common";

import type { TenantContext } from "../common/types/request-user";

@Injectable()
export class BusinessOverviewService {
  getOverview(tenant: TenantContext) {
    return {
      business: {
        id: tenant.businessId,
        slug: tenant.businessSlug,
        name: tenant.businessName,
        vertical: tenant.businessVertical,
      },
      membership: {
        role: tenant.role,
      },
    };
  }
}
