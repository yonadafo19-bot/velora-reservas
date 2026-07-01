import { Module } from "@nestjs/common";

import { DatabaseModule } from "../common/database/database.module";
import { TenantGuard } from "../tenancy/tenant.guard";
import { TenancyModule } from "../tenancy/tenancy.module";
import { AppointmentSchedulingService } from "./appointment-scheduling.service";
import { BusinessAdminAvailabilityService } from "./business-admin-availability.service";
import { BusinessAdminProfessionalsService } from "./business-admin-professionals.service";
import { BusinessAdminServicesService } from "./business-admin-services.service";
import { BusinessAppointmentCreateService } from "./business-appointment-create.service";
import { BusinessAppointmentDetailService } from "./business-appointment-detail.service";
import { BusinessAppointmentStatusService } from "./business-appointment-status.service";
import { BusinessAppointmentsService } from "./business-appointments.service";
import { BusinessCalendarDashboardService } from "./business-calendar-dashboard.service";
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
    BusinessAdminServicesService,
    BusinessAdminProfessionalsService,
    BusinessAdminAvailabilityService,
    BusinessServicesService,
    BusinessProfessionalsService,
    BusinessProfessionalAvailabilityService,
    BusinessCustomersService,
    BusinessAppointmentsService,
    BusinessAppointmentDetailService,
    AppointmentSchedulingService,
    BusinessAppointmentCreateService,
    BusinessAppointmentStatusService,
    BusinessCalendarDashboardService,
    TenantGuard,
  ],
})
export class BusinessesModule {}
