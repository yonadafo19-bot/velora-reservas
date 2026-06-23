import { Module } from "@nestjs/common";

import { TenantGuard } from "../tenancy/tenant.guard";
import { TenancyModule } from "../tenancy/tenancy.module";
import { BusinessOverviewService } from "./business-overview.service";
import { BusinessesController } from "./businesses.controller";

@Module({
  imports: [TenancyModule],
  controllers: [BusinessesController],
  providers: [BusinessOverviewService, TenantGuard],
})
export class BusinessesModule {}
