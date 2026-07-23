import { Body, Controller, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import type { MembershipRole } from "@velora/types";

import type { TenantContext } from "../common/types/request-user";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { RequireTenant } from "../tenancy/require-tenant.decorator";
import {
  BusinessAdminAvailabilityService,
  type AdminBusinessHoursReplaceRequest,
  type AdminProfessionalAvailabilityReplaceRequest,
} from "./business-admin-availability.service";
import {
  BusinessAdminProfessionalsService,
  type AdminProfessionalCreateRequest,
  type AdminProfessionalLocationsReplaceRequest,
  type AdminProfessionalServicesReplaceRequest,
  type AdminProfessionalUpdateRequest,
} from "./business-admin-professionals.service";
import {
  BusinessAdminServicesService,
  type AdminServiceCreateRequest,
  type AdminServiceUpdateRequest,
} from "./business-admin-services.service";
import {
  BusinessAppointmentCreateService,
  type CreateAppointmentRequest,
} from "./business-appointment-create.service";
import { BusinessAppointmentDetailService } from "./business-appointment-detail.service";
import {
  BusinessAppointmentStatusService,
  type UpdateAppointmentStatusRequest,
} from "./business-appointment-status.service";
import { BusinessAppointmentsService } from "./business-appointments.service";
import { BusinessCalendarDashboardService } from "./business-calendar-dashboard.service";
import { BusinessCustomersService } from "./business-customers.service";
import { BusinessOverviewService } from "./business-overview.service";
import { BusinessProfessionalAvailabilityService } from "./business-professional-availability.service";
import { BusinessProfessionalsService } from "./business-professionals.service";
import { BusinessServicesService } from "./business-services.service";

const ADMIN_ROLES: MembershipRole[] = ["OWNER" as MembershipRole, "ADMIN" as MembershipRole];

@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly businessOverview: BusinessOverviewService,
    private readonly businessAdminServices: BusinessAdminServicesService,
    private readonly businessAdminProfessionals: BusinessAdminProfessionalsService,
    private readonly businessAdminAvailability: BusinessAdminAvailabilityService,
    private readonly businessServices: BusinessServicesService,
    private readonly businessProfessionals: BusinessProfessionalsService,
    private readonly businessProfessionalAvailability: BusinessProfessionalAvailabilityService,
    private readonly businessCustomers: BusinessCustomersService,
    private readonly businessAppointments: BusinessAppointmentsService,
    private readonly businessAppointmentDetail: BusinessAppointmentDetailService,
    private readonly businessAppointmentCreate: BusinessAppointmentCreateService,
    private readonly businessAppointmentStatus: BusinessAppointmentStatusService,
    private readonly businessCalendarDashboard: BusinessCalendarDashboardService,
  ) {}

  @Get(":businessSlug/overview")
  @RequireTenant(...ADMIN_ROLES)
  overview(@CurrentTenant() tenant: TenantContext) {
    return this.businessOverview.getOverview(tenant);
  }

  @Get(":businessSlug/services")
  @RequireTenant(...ADMIN_ROLES)
  services(@CurrentTenant() tenant: TenantContext) {
    return this.businessServices.listServices(tenant);
  }

  @Get(":businessSlug/locations")
  @RequireTenant(...ADMIN_ROLES)
  locations(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
  ) {
    return this.businessAdminProfessionals.listLocations(tenant, businessSlug);
  }

  @Post(":businessSlug/services")
  @RequireTenant(...ADMIN_ROLES)
  createService(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Body() body: AdminServiceCreateRequest,
  ) {
    return this.businessAdminServices.createService(tenant, businessSlug, body);
  }

  @Patch(":businessSlug/services/:serviceId")
  @RequireTenant(...ADMIN_ROLES)
  updateService(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Param("serviceId") serviceId: string,
    @Body() body: AdminServiceUpdateRequest,
  ) {
    return this.businessAdminServices.updateService(tenant, businessSlug, serviceId, body);
  }

  @Get(":businessSlug/professionals")
  @RequireTenant(...ADMIN_ROLES)
  professionals(@CurrentTenant() tenant: TenantContext) {
    return this.businessProfessionals.listProfessionals(tenant);
  }

  @Post(":businessSlug/professionals")
  @RequireTenant(...ADMIN_ROLES)
  createProfessional(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Body() body: AdminProfessionalCreateRequest,
  ) {
    return this.businessAdminProfessionals.createProfessional(tenant, businessSlug, body);
  }

  @Patch(":businessSlug/professionals/:professionalId")
  @RequireTenant(...ADMIN_ROLES)
  updateProfessional(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Param("professionalId") professionalId: string,
    @Body() body: AdminProfessionalUpdateRequest,
  ) {
    return this.businessAdminProfessionals.updateProfessional(
      tenant,
      businessSlug,
      professionalId,
      body,
    );
  }

  @Put(":businessSlug/professionals/:professionalId/services")
  @RequireTenant(...ADMIN_ROLES)
  replaceProfessionalServices(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Param("professionalId") professionalId: string,
    @Body() body: AdminProfessionalServicesReplaceRequest,
  ) {
    return this.businessAdminProfessionals.replaceProfessionalServices(
      tenant,
      businessSlug,
      professionalId,
      body,
    );
  }

  @Put(":businessSlug/professionals/:professionalId/locations")
  @RequireTenant(...ADMIN_ROLES)
  replaceProfessionalLocations(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Param("professionalId") professionalId: string,
    @Body() body: AdminProfessionalLocationsReplaceRequest,
  ) {
    return this.businessAdminProfessionals.replaceProfessionalLocations(
      tenant,
      businessSlug,
      professionalId,
      body,
    );
  }

  @Get(":businessSlug/professionals/:professionalId/availability")
  @RequireTenant(...ADMIN_ROLES)
  professionalAvailability(
    @CurrentTenant() tenant: TenantContext,
    @Param("professionalId") professionalId: string,
  ) {
    return this.businessProfessionalAvailability.getAvailability(tenant, professionalId);
  }

  @Put(":businessSlug/professionals/:professionalId/availability")
  @RequireTenant(...ADMIN_ROLES)
  replaceProfessionalAvailability(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Param("professionalId") professionalId: string,
    @Body() body: AdminProfessionalAvailabilityReplaceRequest,
  ) {
    return this.businessAdminAvailability.replaceProfessionalAvailability(
      tenant,
      businessSlug,
      professionalId,
      body,
    );
  }

  @Put(":businessSlug/business-hours")
  @RequireTenant(...ADMIN_ROLES)
  replaceBusinessHours(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Body() body: AdminBusinessHoursReplaceRequest,
  ) {
    return this.businessAdminAvailability.replaceBusinessHours(tenant, businessSlug, body);
  }

  @Get(":businessSlug/customers")
  @RequireTenant(...ADMIN_ROLES)
  customers(@CurrentTenant() tenant: TenantContext) {
    return this.businessCustomers.listCustomers(tenant);
  }

  @Get(":businessSlug/appointments")
  @RequireTenant(...ADMIN_ROLES)
  appointments(
    @CurrentTenant() tenant: TenantContext,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.businessAppointments.listAppointments(tenant, { from, to });
  }

  @Get(":businessSlug/appointments/:appointmentId")
  @RequireTenant(...ADMIN_ROLES)
  appointmentDetail(
    @CurrentTenant() tenant: TenantContext,
    @Param("appointmentId") appointmentId: string,
  ) {
    return this.businessAppointmentDetail.getAppointment(tenant, appointmentId);
  }

  @Post(":businessSlug/appointments")
  @RequireTenant(...ADMIN_ROLES)
  createAppointment(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: CreateAppointmentRequest,
  ) {
    return this.businessAppointmentCreate.createAppointment(tenant, body);
  }

  @Patch(":businessSlug/appointments/:appointmentId/status")
  @RequireTenant(...ADMIN_ROLES)
  updateAppointmentStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param("appointmentId") appointmentId: string,
    @Body() body: UpdateAppointmentStatusRequest,
  ) {
    return this.businessAppointmentStatus.updateStatus(tenant, appointmentId, body);
  }

  @Get(":businessSlug/dashboard/calendar")
  @RequireTenant(...ADMIN_ROLES)
  dashboardCalendar(
    @CurrentTenant() tenant: TenantContext,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("locationId") locationId?: string,
    @Query("professionalId") professionalId?: string,
    @Query("status") status?: string,
  ) {
    return this.businessCalendarDashboard.getCalendar(tenant, {
      from,
      to,
      locationId,
      professionalId,
      status,
    });
  }
}
