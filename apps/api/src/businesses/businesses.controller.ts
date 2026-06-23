import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";

import type { TenantContext } from "../common/types/request-user";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { RequireTenant } from "../tenancy/require-tenant.decorator";
import {
  BusinessAppointmentCreateService,
  type CreateAppointmentRequest,
} from "./business-appointment-create.service";
import { BusinessAppointmentDetailService } from "./business-appointment-detail.service";
import { BusinessAppointmentsService } from "./business-appointments.service";
import { BusinessCustomersService } from "./business-customers.service";
import { BusinessOverviewService } from "./business-overview.service";
import { BusinessProfessionalAvailabilityService } from "./business-professional-availability.service";
import { BusinessProfessionalsService } from "./business-professionals.service";
import { BusinessServicesService } from "./business-services.service";

@Controller("businesses")
export class BusinessesController {
  constructor(
    private readonly businessOverview: BusinessOverviewService,
    private readonly businessServices: BusinessServicesService,
    private readonly businessProfessionals: BusinessProfessionalsService,
    private readonly businessProfessionalAvailability: BusinessProfessionalAvailabilityService,
    private readonly businessCustomers: BusinessCustomersService,
    private readonly businessAppointments: BusinessAppointmentsService,
    private readonly businessAppointmentDetail: BusinessAppointmentDetailService,
    private readonly businessAppointmentCreate: BusinessAppointmentCreateService,
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

  @Get(":businessSlug/professionals")
  @RequireTenant()
  professionals(@CurrentTenant() tenant: TenantContext) {
    return this.businessProfessionals.listProfessionals(tenant);
  }

  @Get(":businessSlug/professionals/:professionalId/availability")
  @RequireTenant()
  professionalAvailability(
    @CurrentTenant() tenant: TenantContext,
    @Param("professionalId") professionalId: string,
  ) {
    return this.businessProfessionalAvailability.getAvailability(tenant, professionalId);
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
}
