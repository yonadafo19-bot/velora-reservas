import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database/database.module";
import { TenantGuard } from "../tenancy/tenant.guard";
import { TenancyModule } from "../tenancy/tenancy.module";
import { BusinessAppointmentsService } from "./business-appointments.service";
import { BusinessCustomersService } from "./business-customers.service";
import { BusinessOverviewService } from "./business-overview.service";
import { BusinessProfessionalAvailabilityService } from "./business-professional-availability.service";
import { BusinessProfessionalsService } from "./business-professionals.service";
import { BusinessServicesService } from "./business-services.service";
import { BusinessesController } from "./businesses.controller";

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [BusinessesController],
  providers: [
    BusinessOverviewService,
    BusinessServicesService,
    BusinessProfessionalsService,
    BusinessProfessionalAvailabilityService,
    BusinessCustomersService,
    BusinessAppointmentsService,
    TenantGuard,
  ],
})
export class BusinessesModule {}
