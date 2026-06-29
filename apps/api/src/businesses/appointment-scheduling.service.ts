import { BadRequestException, Injectable } from "@nestjs/common";

import type { PrismaTransaction } from "../common/database/prisma-transaction";

const DEFAULT_TIME_ZONE = "America/Santiago";
const MINUTES_PER_HOUR = 60;

type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface AppointmentSchedulingInput {
  businessId: string;
  locationId: string;
  professionalId: string;
  startAt: Date;
  endAt: Date;
  timezone?: string | null;
}

interface LocalDateTime {
  date: string;
  weekday: Weekday;
  minutes: number;
}

interface LocalWindow {
  weekday: string;
  startsAtLocal: string;
  endsAtLocal: string;
}

interface BusinessWindow {
  weekday: string;
  opensAtLocal: string;
  closesAtLocal: string;
}

const WEEKDAY_BY_SHORT_LABEL: Record<string, Weekday> = {
  Mon: "MONDAY",
  Tue: "TUESDAY",
  Wed: "WEDNESDAY",
  Thu: "THURSDAY",
  Fri: "FRIDAY",
  Sat: "SATURDAY",
  Sun: "SUNDAY",
};

@Injectable()
export class AppointmentSchedulingService {
  async assertCanSchedule(
    transaction: PrismaTransaction,
    input: AppointmentSchedulingInput,
  ): Promise<void> {
    const timezone = input.timezone ?? DEFAULT_TIME_ZONE;

    if (input.startAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        code: "APPOINTMENT_SLOT_IN_PAST",
        message: "El horario seleccionado ya paso.",
      });
    }

    const localStart = this.toLocalDateTime(input.startAt, timezone);
    const localEnd = this.toLocalDateTime(input.endAt, timezone);
    if (localStart.date !== localEnd.date || localEnd.minutes <= localStart.minutes) {
      throw new BadRequestException({
        code: "APPOINTMENT_OUTSIDE_BUSINESS_HOURS",
        message: "La cita debe quedar dentro del mismo dia operativo.",
      });
    }

    const businessHours = await transaction.businessHour.findMany({
      where: {
        businessId: input.businessId,
        status: "ACTIVE",
        OR: [
          { locationId: input.locationId },
          { locationId: null },
        ],
      },
      select: {
        weekday: true,
        opensAtLocal: true,
        closesAtLocal: true,
      },
    });

    if (!this.fitsInAnyWindow(businessHours, localStart, localEnd)) {
      throw new BadRequestException({
        code: "APPOINTMENT_OUTSIDE_BUSINESS_HOURS",
        message: "El horario esta fuera del horario del negocio.",
      });
    }

    const professionalAvailability = await transaction.professionalAvailabilityRule.findMany({
      where: {
        businessId: input.businessId,
        professionalId: input.professionalId,
        locationId: input.locationId,
        status: "ACTIVE",
      },
      select: {
        weekday: true,
        startsAtLocal: true,
        endsAtLocal: true,
      },
    });

    if (!this.fitsInAnyWindow(professionalAvailability, localStart, localEnd)) {
      throw new BadRequestException({
        code: "APPOINTMENT_OUTSIDE_PROFESSIONAL_AVAILABILITY",
        message: "El profesional no esta disponible en ese horario.",
      });
    }

    const blockedSlot = await transaction.timeOff.findFirst({
      where: {
        businessId: input.businessId,
        status: "ACTIVE",
        startsAt: {
          lt: input.endAt,
        },
        endsAt: {
          gt: input.startAt,
        },
        OR: [
          { professionalId: input.professionalId },
          {
            professionalId: null,
            locationId: input.locationId,
          },
          {
            professionalId: null,
            locationId: null,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (blockedSlot) {
      throw new BadRequestException({
        code: "APPOINTMENT_SLOT_BLOCKED",
        message: "El horario seleccionado esta bloqueado.",
      });
    }

    const overlappingSegment = await transaction.appointmentSegment.findFirst({
      where: {
        businessId: input.businessId,
        professionalId: input.professionalId,
        blocksAvailability: true,
        status: "SCHEDULED",
        startsAt: {
          lt: input.endAt,
        },
        endsAt: {
          gt: input.startAt,
        },
      },
      select: {
        id: true,
      },
    });

    if (overlappingSegment) {
      throw new BadRequestException({
        code: "APPOINTMENT_SLOT_ALREADY_TAKEN",
        message: "El horario seleccionado ya esta reservado.",
      });
    }
  }

  private fitsInAnyWindow(
    windows: Array<BusinessWindow | LocalWindow>,
    localStart: LocalDateTime,
    localEnd: LocalDateTime,
  ): boolean {
    return windows.some((window) => {
      if (window.weekday !== localStart.weekday) {
        return false;
      }

      const startsAtLocal = "opensAtLocal" in window
        ? window.opensAtLocal
        : window.startsAtLocal;
      const endsAtLocal = "closesAtLocal" in window
        ? window.closesAtLocal
        : window.endsAtLocal;
      const windowStart = this.toMinutes(startsAtLocal);
      const windowEnd = this.toMinutes(endsAtLocal);

      return localStart.minutes >= windowStart && localEnd.minutes <= windowEnd;
    });
  }

  private toLocalDateTime(date: Date, timezone: string): LocalDateTime {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(date);
    const valueByType = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const weekday = WEEKDAY_BY_SHORT_LABEL[valueByType.weekday];

    if (!weekday) {
      throw new RangeError(`Unsupported weekday ${valueByType.weekday}.`);
    }

    return {
      date: `${valueByType.year}-${valueByType.month}-${valueByType.day}`,
      weekday,
      minutes: (Number(valueByType.hour) * MINUTES_PER_HOUR) + Number(valueByType.minute),
    };
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map(Number);

    return (hours * MINUTES_PER_HOUR) + minutes;
  }
}
