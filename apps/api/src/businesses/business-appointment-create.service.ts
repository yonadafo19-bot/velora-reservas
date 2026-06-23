import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { TransactionService } from "../common/database/transaction.service";
import type { TenantContext } from "../common/types/request-user";
import { BusinessAppointmentDetailService } from "./business-appointment-detail.service";

const ALLOWED_APPOINTMENT_SOURCES = new Set([
  "ADMIN",
  "PUBLIC_WEB",
  "WHATSAPP",
  "SYSTEM",
]);

const MILLISECONDS_PER_MINUTE = 60 * 1000;

export interface CreateAppointmentRequest {
  locationId: string;
  customerId: string;
  startAt: string;
  serviceIds: string[];
  professionalId?: string;
  source?: string;
}

interface OrderedService {
  id: string;
  name: string;
  basePriceClp: number;
  durationMinutes: number;
}

@Injectable()
export class BusinessAppointmentCreateService {
  constructor(
    private readonly transactions: TransactionService,
    private readonly appointmentDetail: BusinessAppointmentDetailService,
  ) {}

  async createAppointment(
    tenant: TenantContext,
    body: CreateAppointmentRequest,
  ) {
    const input = this.validateInput(body);

    const appointmentId = await this.transactions.runInTransaction(async (transaction) => {
      const business = await transaction.business.findFirst({
        where: {
          id: tenant.businessId,
        },
        select: {
          id: true,
          currency: true,
          timezone: true,
        },
      });

      if (!business) {
        throw this.invalidInput();
      }

      const location = await transaction.location.findFirst({
        where: {
          id: input.locationId,
          businessId: tenant.businessId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          timezone: true,
        },
      });

      if (!location) {
        throw new NotFoundException({
          code: "LOCATION_NOT_FOUND",
          message: "La sucursal no existe en este negocio.",
        });
      }

      const customer = await transaction.customer.findFirst({
        where: {
          id: input.customerId,
          businessId: tenant.businessId,
        },
        select: {
          id: true,
          firstVisitAt: true,
        },
      });

      if (!customer) {
        throw new NotFoundException({
          code: "CUSTOMER_NOT_FOUND",
          message: "El cliente no existe en este negocio.",
        });
      }

      const services = await transaction.service.findMany({
        where: {
          businessId: tenant.businessId,
          id: {
            in: input.serviceIds,
          },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          basePriceClp: true,
          durationMinutes: true,
        },
      });
      const orderedServices = this.orderServicesByRequest(input.serviceIds, services);

      if (orderedServices.length !== input.serviceIds.length) {
        throw new NotFoundException({
          code: "SERVICE_NOT_FOUND",
          message: "Uno o mas servicios no existen en este negocio.",
        });
      }

      if (input.professionalId) {
        const professional = await transaction.professional.findFirst({
          where: {
            id: input.professionalId,
            businessId: tenant.businessId,
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
        });

        if (!professional) {
          throw new NotFoundException({
            code: "PROFESSIONAL_NOT_FOUND",
            message: "El profesional no existe en este negocio.",
          });
        }

        const professionalServices = await transaction.professionalService.findMany({
          where: {
            businessId: tenant.businessId,
            professionalId: input.professionalId,
            serviceId: {
              in: input.serviceIds,
            },
            status: "ACTIVE",
          },
          select: {
            serviceId: true,
          },
        });
        const allowedServiceIds = new Set(professionalServices.map((service) => service.serviceId));

        if (!input.serviceIds.every((serviceId) => allowedServiceIds.has(serviceId))) {
          throw new BadRequestException({
            code: "PROFESSIONAL_SERVICE_NOT_ALLOWED",
            message: "El profesional no puede realizar uno o mas servicios.",
          });
        }
      }

      const totalDurationMinutes = orderedServices.reduce(
        (total, service) => total + service.durationMinutes,
        0,
      );
      const totalPriceClp = orderedServices.reduce(
        (total, service) => total + service.basePriceClp,
        0,
      );
      const endAt = new Date(
        input.startAt.getTime() + (totalDurationMinutes * MILLISECONDS_PER_MINUTE),
      );

      const appointment = await transaction.appointment.create({
        data: {
          businessId: tenant.businessId,
          locationId: input.locationId,
          customerId: input.customerId,
          status: "CONFIRMED",
          source: input.source,
          startAt: input.startAt,
          endAt,
          totalPriceClp,
          totalDurationMinutes,
          currencySnapshot: business.currency,
          timezoneSnapshot: location.timezone ?? business.timezone,
          isFirstVisit: customer.firstVisitAt === null,
          depositRequiredSnapshot: false,
        },
        select: {
          id: true,
        },
      });

      let segmentStartsAt = input.startAt;
      for (const [index, service] of orderedServices.entries()) {
        const appointmentService = await transaction.appointmentService.create({
          data: {
            businessId: tenant.businessId,
            appointmentId: appointment.id,
            serviceId: service.id,
            sequence: index + 1,
            serviceNameSnapshot: service.name,
            servicePriceClpSnapshot: service.basePriceClp,
            serviceDurationMinutesSnapshot: service.durationMinutes,
          },
          select: {
            id: true,
          },
        });

        if (input.professionalId) {
          const segmentEndsAt = new Date(
            segmentStartsAt.getTime() + (service.durationMinutes * MILLISECONDS_PER_MINUTE),
          );

          await transaction.appointmentSegment.create({
            data: {
              businessId: tenant.businessId,
              appointmentId: appointment.id,
              appointmentServiceId: appointmentService.id,
              professionalId: input.professionalId,
              locationId: input.locationId,
              sequence: index + 1,
              startsAt: segmentStartsAt,
              endsAt: segmentEndsAt,
              blocksAvailability: true,
              status: "SCHEDULED",
            },
          });
          segmentStartsAt = segmentEndsAt;
        }
      }

      await transaction.appointmentStatusHistory.create({
        data: {
          businessId: tenant.businessId,
          appointmentId: appointment.id,
          previousStatus: null,
          nextStatus: "CONFIRMED",
          actorType: "ADMIN",
          actorId: tenant.userId,
        },
      });

      return appointment.id;
    });

    return this.appointmentDetail.getAppointment(tenant, appointmentId);
  }

  private validateInput(body: CreateAppointmentRequest): {
    locationId: string;
    customerId: string;
    startAt: Date;
    serviceIds: string[];
    professionalId?: string;
    source: "ADMIN" | "PUBLIC_WEB" | "WHATSAPP" | "SYSTEM";
  } {
    if (!body || typeof body !== "object") {
      throw this.invalidInput();
    }

    if (!this.isNonEmptyString(body.locationId)
      || !this.isNonEmptyString(body.customerId)
      || !this.isNonEmptyString(body.startAt)
      || !Array.isArray(body.serviceIds)
      || body.serviceIds.length === 0
      || !body.serviceIds.every((serviceId) => this.isNonEmptyString(serviceId))) {
      throw this.invalidInput();
    }

    const uniqueServiceIds = new Set(body.serviceIds);
    if (uniqueServiceIds.size !== body.serviceIds.length) {
      throw this.invalidInput();
    }

    const startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw this.invalidInput();
    }

    if (body.professionalId !== undefined && !this.isNonEmptyString(body.professionalId)) {
      throw this.invalidInput();
    }

    const source = body.source ?? "ADMIN";
    if (!ALLOWED_APPOINTMENT_SOURCES.has(source)) {
      throw this.invalidInput();
    }

    return {
      locationId: body.locationId,
      customerId: body.customerId,
      startAt,
      serviceIds: body.serviceIds,
      professionalId: body.professionalId,
      source: source as "ADMIN" | "PUBLIC_WEB" | "WHATSAPP" | "SYSTEM",
    };
  }

  private orderServicesByRequest(
    serviceIds: string[],
    services: OrderedService[],
  ): OrderedService[] {
    const servicesById = new Map(services.map((service) => [service.id, service]));

    return serviceIds
      .map((serviceId) => servicesById.get(serviceId))
      .filter((service): service is OrderedService => Boolean(service));
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
  }

  private invalidInput(): BadRequestException {
    return new BadRequestException({
      code: "APPOINTMENT_CREATE_INVALID_INPUT",
      message: "Los datos de la cita no son validos.",
    });
  }
}
