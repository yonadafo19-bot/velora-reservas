import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  AppointmentStatus as PrismaAppointmentStatus,
  Prisma,
} from "@velora/database";

import { DatabaseService } from "../common/database/database.service";
import type { TenantContext } from "../common/types/request-user";

const DEFAULT_TIME_ZONE = "America/Santiago";
const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 31;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const CALENDAR_STATUSES: PrismaAppointmentStatus[] = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

interface CalendarQueryInput {
  from?: string;
  to?: string;
  locationId?: string;
  professionalId?: string;
  status?: string;
}

interface CalendarAppointmentSegment {
  professional: {
    id: string;
    displayName: string;
    roleTitle: string | null;
  };
}

@Injectable()
export class BusinessCalendarDashboardService {
  constructor(private readonly database: DatabaseService) {}

  async getCalendar(
    tenant: TenantContext,
    queryInput: CalendarQueryInput,
  ) {
    const business = await this.database.getClient().business.findFirst({
      where: {
        id: tenant.businessId,
      },
      select: {
        timezone: true,
      },
    });
    const timezone = this.resolveTimeZone(business?.timezone);
    const query = this.validateQuery(queryInput, timezone);

    const where: Prisma.AppointmentWhereInput = {
      businessId: tenant.businessId,
      startAt: {
        lt: query.toDate,
      },
      endAt: {
        gt: query.fromDate,
      },
      status: query.status ?? {
        in: CALENDAR_STATUSES,
      },
    };

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.professionalId) {
      where.segments = {
        some: {
          businessId: tenant.businessId,
          professionalId: query.professionalId,
        },
      };
    }

    const appointments = await this.database.getClient().appointment.findMany({
      where,
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

    const byStatus = {
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    };

    const mappedAppointments = appointments.map((appointment) => {
      byStatus[appointment.status as keyof typeof byStatus] += 1;

      const professionals = new Map<string, {
        id: string;
        displayName: string;
        roleTitle: string | null;
      }>();

      for (const segment of appointment.segments as CalendarAppointmentSegment[]) {
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
        localDate: this.formatLocalDate(appointment.startAt, timezone),
        totalPriceClp: appointment.totalPriceClp,
        totalDurationMinutes: appointment.totalDurationMinutes,
        currency: appointment.currencySnapshot,
        timezone: appointment.timezoneSnapshot,
        isFirstVisit: appointment.isFirstVisit,
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

    return {
      range: {
        from: query.fromDate.toISOString(),
        to: query.toDate.toISOString(),
        timezone,
      },
      summary: {
        total: mappedAppointments.length,
        byStatus,
      },
      appointments: mappedAppointments,
    };
  }

  private validateQuery(
    queryInput: CalendarQueryInput,
    timezone: string,
  ): {
    fromDate: Date;
    toDate: Date;
    locationId?: string;
    professionalId?: string;
    status?: PrismaAppointmentStatus;
  } {
    if (queryInput.locationId !== undefined && !this.isNonEmptyString(queryInput.locationId)) {
      throw this.invalidQuery();
    }

    if (queryInput.professionalId !== undefined
      && !this.isNonEmptyString(queryInput.professionalId)) {
      throw this.invalidQuery();
    }

    if (queryInput.status !== undefined
      && !CALENDAR_STATUSES.includes(queryInput.status as PrismaAppointmentStatus)) {
      throw this.invalidQuery();
    }

    const providedFromDate = queryInput.from ? this.parseDate(queryInput.from) : null;
    const providedToDate = queryInput.to ? this.parseDate(queryInput.to) : null;
    let fromDate: Date;
    let toDate: Date;

    if (providedFromDate && providedToDate) {
      fromDate = providedFromDate;
      toDate = providedToDate;
    } else if (providedFromDate) {
      fromDate = providedFromDate;
      toDate = this.addDays(fromDate, DEFAULT_RANGE_DAYS);
    } else if (providedToDate) {
      toDate = providedToDate;
      fromDate = this.addDays(toDate, -DEFAULT_RANGE_DAYS);
    } else {
      fromDate = this.startOfCurrentDayInTimeZone(timezone);
      toDate = this.addDays(fromDate, DEFAULT_RANGE_DAYS);
    }

    if (fromDate >= toDate || toDate.getTime() - fromDate.getTime() > MAX_RANGE_DAYS * MILLISECONDS_PER_DAY) {
      throw this.invalidQuery();
    }

    return {
      fromDate,
      toDate,
      locationId: queryInput.locationId,
      professionalId: queryInput.professionalId,
      status: queryInput.status as PrismaAppointmentStatus | undefined,
    };
  }

  private parseDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw this.invalidQuery();
    }

    return date;
  }

  private startOfCurrentDayInTimeZone(timezone: string): Date {
    const now = new Date();
    const parts = this.getDatePartsInTimeZone(now, timezone);

    return this.localDateTimeToUtc(
      Number(parts.year),
      Number(parts.month),
      Number(parts.day),
      timezone,
    );
  }

  private localDateTimeToUtc(
    year: number,
    month: number,
    day: number,
    timezone: string,
  ): Date {
    const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const firstOffset = this.getTimezoneOffsetMilliseconds(utcGuess, timezone);
    const firstCandidate = new Date(utcGuess.getTime() - firstOffset);
    const secondOffset = this.getTimezoneOffsetMilliseconds(firstCandidate, timezone);

    return new Date(utcGuess.getTime() - secondOffset);
  }

  private getTimezoneOffsetMilliseconds(date: Date, timezone: string): number {
    const parts = this.getDateTimePartsInTimeZone(date, timezone);
    const utcTime = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );

    return utcTime - date.getTime();
  }

  private formatLocalDate(date: Date, timezone: string): string {
    const parts = this.getDatePartsInTimeZone(date, timezone);

    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  private getDatePartsInTimeZone(
    date: Date,
    timezone: string,
  ): Record<"year" | "month" | "day", string> {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    return this.partsToRecord(parts, ["year", "month", "day"]);
  }

  private getDateTimePartsInTimeZone(
    date: Date,
    timezone: string,
  ): Record<"year" | "month" | "day" | "hour" | "minute" | "second", string> {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);

    return this.partsToRecord(parts, ["year", "month", "day", "hour", "minute", "second"]);
  }

  private partsToRecord<T extends string>(
    parts: Intl.DateTimeFormatPart[],
    names: T[],
  ): Record<T, string> {
    return Object.fromEntries(
      names.map((name) => {
        const value = parts.find((part) => part.type === name)?.value;

        if (!value) {
          throw this.invalidQuery();
        }

        return [name, value];
      }),
    ) as Record<T, string>;
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + (days * MILLISECONDS_PER_DAY));
  }

  private resolveTimeZone(value?: string | null): string {
    if (!value || value.trim().length === 0) {
      return DEFAULT_TIME_ZONE;
    }

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
      return value;
    } catch {
      return DEFAULT_TIME_ZONE;
    }
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
  }

  private invalidQuery(): BadRequestException {
    return new BadRequestException({
      code: "CALENDAR_QUERY_INVALID",
      message: "Los filtros del calendario no son validos.",
    });
  }
}
