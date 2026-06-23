import { BadRequestException, Injectable } from "@nestjs/common";

import { DatabaseService } from "../common/database/database.service";
import type { TenantContext } from "../common/types/request-user";

const DEFAULT_APPOINTMENT_RANGE_DAYS = 14;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface AppointmentDateRangeInput {
  from?: string;
  to?: string;
}

@Injectable()
export class BusinessAppointmentsService {
  constructor(private readonly database: DatabaseService) {}

  async listAppointments(
    tenant: TenantContext,
    rangeInput: AppointmentDateRangeInput,
  ) {
    const { fromDate, toDate } = this.resolveDateRange(rangeInput);
    const appointments = await this.database.getClient().appointment.findMany({
      where: {
        businessId: tenant.businessId,
        startAt: {
          lt: toDate,
        },
        endAt: {
          gt: fromDate,
        },
      },
      select: {
        id: true,
        status: true,
        source: true,
        startAt: true,
        endAt: true,
        totalPriceClp: true,
        totalDurationMinutes: true,
        currencySnapshot: true,
        timezoneSnapshot: true,
        isFirstVisit: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        services: {
          select: {
            id: true,
            serviceId: true,
            packId: true,
            sequence: true,
            serviceNameSnapshot: true,
            servicePriceClpSnapshot: true,
            serviceDurationMinutesSnapshot: true,
          },
          orderBy: [
            { sequence: "asc" },
            { id: "asc" },
          ],
        },
        segments: {
          select: {
            id: true,
            professionalId: true,
            locationId: true,
            sequence: true,
            startsAt: true,
            endsAt: true,
            status: true,
            professional: {
              select: {
                id: true,
                displayName: true,
                roleTitle: true,
              },
            },
          },
          orderBy: [
            { sequence: "asc" },
            { startsAt: "asc" },
            { id: "asc" },
          ],
        },
      },
      orderBy: [
        { startAt: "asc" },
        { id: "asc" },
      ],
    });

    return appointments.map((appointment) => {
      const professionals = new Map<string, {
        id: string;
        displayName: string;
        roleTitle: string | null;
      }>();

      for (const segment of appointment.segments) {
        if (!professionals.has(segment.professional.id)) {
          professionals.set(segment.professional.id, {
            id: segment.professional.id,
            displayName: segment.professional.displayName,
            roleTitle: segment.professional.roleTitle,
          });
        }
      }

      return {
        id: appointment.id,
        status: appointment.status,
        source: appointment.source,
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
        totalPriceClp: appointment.totalPriceClp,
        totalDurationMinutes: appointment.totalDurationMinutes,
        currency: appointment.currencySnapshot,
        timezone: appointment.timezoneSnapshot,
        isFirstVisit: appointment.isFirstVisit,
        createdAt: appointment.createdAt.toISOString(),
        customer: {
          id: appointment.customer.id,
          fullName: [
            appointment.customer.firstName,
            appointment.customer.lastName,
          ].filter(Boolean).join(" "),
          phone: appointment.customer.phone,
          email: appointment.customer.email,
        },
        location: {
          id: appointment.location.id,
          name: appointment.location.name,
          slug: appointment.location.slug,
        },
        services: appointment.services.map((service) => ({
          id: service.id,
          serviceId: service.serviceId,
          packId: service.packId,
          sequence: service.sequence,
          name: service.serviceNameSnapshot,
          durationMinutes: service.serviceDurationMinutesSnapshot,
          priceClp: service.servicePriceClpSnapshot,
        })),
        professionals: [...professionals.values()],
        segments: appointment.segments.map((segment) => ({
          id: segment.id,
          professionalId: segment.professionalId,
          locationId: segment.locationId,
          sequence: segment.sequence,
          startsAt: segment.startsAt.toISOString(),
          endsAt: segment.endsAt.toISOString(),
          status: segment.status,
        })),
      };
    });
  }

  private resolveDateRange(rangeInput: AppointmentDateRangeInput): {
    fromDate: Date;
    toDate: Date;
  } {
    const now = new Date();
    const fromDate = rangeInput.from ? this.parseDate(rangeInput.from) : now;
    const toDate = rangeInput.to
      ? this.parseDate(rangeInput.to)
      : new Date(fromDate.getTime() + (DEFAULT_APPOINTMENT_RANGE_DAYS * MILLISECONDS_PER_DAY));

    if (fromDate >= toDate) {
      throw this.invalidDateRange();
    }

    return { fromDate, toDate };
  }

  private parseDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw this.invalidDateRange();
    }

    return date;
  }

  private invalidDateRange(): BadRequestException {
    return new BadRequestException({
      code: "APPOINTMENT_DATE_RANGE_INVALID",
      message: "El rango de fechas de la agenda no es valido.",
    });
  }
}
