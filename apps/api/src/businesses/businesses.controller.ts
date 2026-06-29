import { Body, Controller, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";

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
  @RequireTenant()
  overview(@CurrentTenant() tenant: TenantContext) {
    return this.businessOverview.getOverview(tenant);
  }

  @Get(":businessSlug/services")
  @RequireTenant()
  services(@CurrentTenant() tenant: TenantContext) {
    return this.businessServices.listServices(tenant);
  }

  @Post(":businessSlug/services")
  @RequireTenant()
  createService(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Body() body: AdminServiceCreateRequest,
  ) {
    return this.businessAdminServices.createService(tenant, businessSlug, body);
  }

  @Patch(":businessSlug/services/:serviceId")
  @RequireTenant()
  updateService(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Param("serviceId") serviceId: string,
    @Body() body: AdminServiceUpdateRequest,
  ) {
    return this.businessAdminServices.updateService(tenant, businessSlug, serviceId, body);
  }

  @Get(":businessSlug/professionals")
  @RequireTenant()
  professionals(@CurrentTenant() tenant: TenantContext) {
    return this.businessProfessionals.listProfessionals(tenant);
  }

  @Post(":businessSlug/professionals")
  @RequireTenant()
  createProfessional(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Body() body: AdminProfessionalCreateRequest,
  ) {
    return this.businessAdminProfessionals.createProfessional(tenant, businessSlug, body);
  }

  @Patch(":businessSlug/professionals/:professionalId")
  @RequireTenant()
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
  @RequireTenant()
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

  @Get(":businessSlug/professionals/:professionalId/availability")
  @RequireTenant()
  professionalAvailability(
    @CurrentTenant() tenant: TenantContext,
    @Param("professionalId") professionalId: string,
  ) {
    return this.businessProfessionalAvailability.getAvailability(tenant, professionalId);
  }

  @Put(":businessSlug/professionals/:professionalId/availability")
  @RequireTenant()
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
  @RequireTenant()
  replaceBusinessHours(
    @CurrentTenant() tenant: TenantContext,
    @Param("businessSlug") businessSlug: string,
    @Body() body: AdminBusinessHoursReplaceRequest,
  ) {
    return this.businessAdminAvailability.replaceBusinessHours(tenant, businessSlug, body);
  }

  @Get(":businessSlug/customers")
  @RequireTenant()
  customers(@CurrentTenant() tenant: TenantContext) {
    return this.businessCustomers.listCustomers(tenant);
  }

  @Get(":businessSlug/appointments")
  @RequireTenant()
  appointments(
    @CurrentTenant() tenant: TenantContext,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.businessAppointments.listAppointments(tenant, { from, to });
  }

  @Get(":businessSlug/appointments/:appointmentId")
  @RequireTenant()
  appointmentDetail(
    @CurrentTenant() tenant: TenantContext,
    @Param("appointmentId") appointmentId: string,
  ) {
    return this.businessAppointmentDetail.getAppointment(tenant, appointmentId);
  }

  @Post(":businessSlug/appointments")
  @RequireTenant()
  createAppointment(
    @CurrentTenant() tenant: TenantContext,
    @Body() body: CreateAppointmentRequest,
  ) {
    return this.businessAppointmentCreate.createAppointment(tenant, body);
  }

  @Patch(":businessSlug/appointments/:appointmentId/status")
  @RequireTenant()
  updateAppointmentStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param("appointmentId") appointmentId: string,
    @Body() body: UpdateAppointmentStatusRequest,
  ) {
    return this.businessAppointmentStatus.updateStatus(tenant, appointmentId, body);
  }

  @Get(":businessSlug/dashboard/calendar")
  @RequireTenant()
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
