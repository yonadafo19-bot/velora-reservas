import { Controller, Get } from "@nestjs/common";

import type { TenantContext } from "../common/types/request-user";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { RequireTenant } from "../tenancy/require-tenant.decorator";
import { BusinessOverviewService } from "./business-overview.service";
import { BusinessServicesService } from "./business-services.service";

@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly businessOverview: BusinessOverviewService,
    private readonly businessServices: BusinessServicesService,
  ) {}

  @Get(":businessSlug/overview")
  @RequireTenant()
  overview(@CurrentTenant() tenant: TenantContext) {
    return this.businessOverview.getOverview(tenant);
  }

  @Get(":businessSlug/services")
  @RequireTenant()
  services(@CurrentTenant() tenant: TenantContext) {
    return this.businessServices.listServices(tenant);
  }
}
