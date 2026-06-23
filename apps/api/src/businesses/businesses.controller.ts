import { Controller, Get } from "@nestjs/common";

import type { TenantContext } from "../common/types/request-user";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { RequireTenant } from "../tenancy/require-tenant.decorator";
import { BusinessOverviewService } from "./business-overview.service";

@Controller("businesses")
export class BusinessesController {
  constructor(private readonly businessOverview: BusinessOverviewService) {}

  @Get(":businessSlug/overview")
  @RequireTenant()
  overview(@CurrentTenant() tenant: TenantContext) {
    return this.businessOverview.getOverview(tenant);
  }
}
