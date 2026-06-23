import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database/database.module";
import { TenantGuard } from "../tenancy/tenant.guard";
import { TenancyModule } from "../tenancy/tenancy.module";
import { BusinessOverviewService } from "./business-overview.service";
import { BusinessServicesService } from "./business-services.service";
import { BusinessesController } from "./businesses.controller";

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [BusinessesController],
  providers: [BusinessOverviewService, BusinessServicesService, TenantGuard],
})
export class BusinessesModule {}
