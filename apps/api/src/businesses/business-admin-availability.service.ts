import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Weekday as PrismaWeekday,
} from "@velora/database";

import type { PrismaTransaction } from "../common/database/prisma-transaction";
import { TransactionService } from "../common/database/transaction.service";
import type { TenantContext } from "../common/types/request-user";
import { normalizeAvailabilityStatus } from "./business-admin-professionals.service";

const ALLOWED_WEEKDAYS = new Set([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface AdminBusinessHoursReplaceRequest {
  hours: Array<{
    locationId?: string | null;
    weekday: string;
    opensAtLocal: string;
    closesAtLocal: string;
    status?: string;
  }>;
}

export interface AdminProfessionalAvailabilityReplaceRequest {
  rules: Array<{
    locationId: string;
    weekday: string;
    startsAtLocal: string;
    endsAtLocal: string;
    status?: string;
  }>;
}

@Injectable()
export class BusinessAdminAvailabilityService {
  constructor(private readonly transactions: TransactionService) {}

  async replaceBusinessHours(
    tenant: TenantContext,
    businessSlug: string,
    body: AdminBusinessHoursReplaceRequest | AdminBusinessHoursReplaceRequest["hours"],
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const input = this.validateBusinessHoursInput(body);

    return this.transactions.runInTransaction(async (transaction) => {
      await this.assertLocationsBelongToTenant(
        transaction,
        tenant.businessId,
        input.map((entry) => entry.locationId).filter((locationId): locationId is string => Boolean(locationId)),
      );

      await transaction.businessHour.updateMany({
        where: {
          businessId: tenant.businessId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      for (const entry of input) {
        await transaction.businessHour.create({
          data: {
            businessId: tenant.businessId,
            locationId: entry.locationId,
            weekday: entry.weekday,
            opensAtLocal: entry.opensAtLocal,
            closesAtLocal: entry.closesAtLocal,
            status: entry.status,
          },
        });
      }

      return this.getBusinessHoursResponse(transaction, tenant.businessId);
    });
  }

  async replaceProfessionalAvailability(
    tenant: TenantContext,
    businessSlug: string,
    professionalId: string,
    body: AdminProfessionalAvailabilityReplaceRequest | AdminProfessionalAvailabilityReplaceRequest["rules"],
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const input = this.validateProfessionalAvailabilityInput(body);

    return this.transactions.runInTransaction(async (transaction) => {
      await this.assertProfessionalBelongsToTenant(transaction, tenant.businessId, professionalId);
      await this.assertLocationsBelongToTenant(
        transaction,
        tenant.businessId,
        input.map((entry) => entry.locationId),
      );

      await transaction.professionalAvailabilityRule.updateMany({
        where: {
          businessId: tenant.businessId,
          professionalId,
          status: "ACTIVE",
        },
        data: {
          status: "INACTIVE",
        },
      });

      for (const entry of input) {
        await transaction.professionalAvailabilityRule.create({
          data: {
            businessId: tenant.businessId,
            professionalId,
            locationId: entry.locationId,
            weekday: entry.weekday,
            startsAtLocal: entry.startsAtLocal,
            endsAtLocal: entry.endsAtLocal,
            status: entry.status,
          },
        });
      }

      return this.getProfessionalAvailabilityResponse(
        transaction,
        tenant.businessId,
        professionalId,
      );
    });
  }

  private async getBusinessHoursResponse(transaction: PrismaTransaction, businessId: string) {
    const hours = await transaction.businessHour.findMany({
      where: {
        businessId,
      },
      select: {
        id: true,
        locationId: true,
        weekday: true,
        opensAtLocal: true,
        closesAtLocal: true,
        status: true,
      },
      orderBy: [
        { locationId: "asc" },
        { weekday: "asc" },
        { opensAtLocal: "asc" },
        { id: "asc" },
      ],
    });

    return {
      hours: hours.map((hour) => ({
        id: hour.id,
        locationId: hour.locationId,
        weekday: hour.weekday,
        opensAtLocal: hour.opensAtLocal,
        closesAtLocal: hour.closesAtLocal,
        status: hour.status,
      })),
    };
  }

  private async getProfessionalAvailabilityResponse(
    transaction: PrismaTransaction,
    businessId: string,
    professionalId: string,
  ) {
    const rules = await transaction.professionalAvailabilityRule.findMany({
      where: {
        businessId,
        professionalId,
      },
      select: {
        id: true,
        locationId: true,
        weekday: true,
        startsAtLocal: true,
        endsAtLocal: true,
        status: true,
      },
      orderBy: [
        { locationId: "asc" },
        { weekday: "asc" },
        { startsAtLocal: "asc" },
        { id: "asc" },
      ],
    });

    return {
      professionalId,
      rules: rules.map((rule) => ({
        id: rule.id,
        locationId: rule.locationId,
        weekday: rule.weekday,
        startsAtLocal: rule.startsAtLocal,
        endsAtLocal: rule.endsAtLocal,
        status: rule.status,
      })),
    };
  }

  private async assertProfessionalBelongsToTenant(
    transaction: PrismaTransaction,
    businessId: string,
    professionalId: string,
  ) {
    const professional = await transaction.professional.findFirst({
      where: {
        id: professionalId,
        businessId,
      },
      select: {
        id: true,
      },
    });

    if (!professional) {
      throw new NotFoundException({
        code: "ADMIN_PROFESSIONAL_NOT_FOUND",
        message: "El profesional no existe en este negocio.",
      });
    }
  }

  private async assertLocationsBelongToTenant(
    transaction: PrismaTransaction,
    businessId: string,
    locationIds: string[],
  ) {
    const uniqueLocationIds = [...new Set(locationIds)];
    if (uniqueLocationIds.length === 0) {
      return;
    }

    const locations = await transaction.location.findMany({
      where: {
        businessId,
        id: {
          in: uniqueLocationIds,
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    const foundIds = new Set(locations.map((location) => location.id));

    if (!uniqueLocationIds.every((locationId) => foundIds.has(locationId))) {
      throw new BadRequestException({
        code: "ADMIN_LOCATION_INVALID",
        message: "Una o mas sucursales no estan disponibles para este negocio.",
      });
    }
  }

  private validateBusinessHoursInput(
    body: AdminBusinessHoursReplaceRequest | AdminBusinessHoursReplaceRequest["hours"],
  ) {
    const entries = Array.isArray(body)
      ? body
      : body && typeof body === "object" && Array.isArray(body.hours)
        ? body.hours
        : null;

    if (!entries) {
      throw this.invalidInput();
    }

    return entries.map((entry) => {
      if (!entry || typeof entry !== "object") {
        throw this.invalidInput();
      }
      this.assertTimeRange(entry.opensAtLocal, entry.closesAtLocal);

      return {
        locationId: this.optionalId(entry.locationId),
        weekday: this.weekday(entry.weekday),
        opensAtLocal: entry.opensAtLocal,
        closesAtLocal: entry.closesAtLocal,
        status: normalizeAvailabilityStatus(entry.status ?? "ACTIVE"),
      };
    });
  }

  private validateProfessionalAvailabilityInput(
    body: AdminProfessionalAvailabilityReplaceRequest | AdminProfessionalAvailabilityReplaceRequest["rules"],
  ) {
    const entries = Array.isArray(body)
      ? body
      : body && typeof body === "object" && Array.isArray(body.rules)
        ? body.rules
        : null;

    if (!entries) {
      throw this.invalidInput();
    }

    return entries.map((entry) => {
      if (!entry || typeof entry !== "object") {
        throw this.invalidInput();
      }
      this.assertTimeRange(entry.startsAtLocal, entry.endsAtLocal);

      return {
        locationId: this.requiredId(entry.locationId),
        weekday: this.weekday(entry.weekday),
        startsAtLocal: entry.startsAtLocal,
        endsAtLocal: entry.endsAtLocal,
        status: normalizeAvailabilityStatus(entry.status ?? "ACTIVE"),
      };
    });
  }

  private assertTimeRange(start: unknown, end: unknown) {
    if (typeof start !== "string" || typeof end !== "string") {
      throw this.invalidInput();
    }
    if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
      throw this.invalidInput();
    }
    if (this.toMinutes(start) >= this.toMinutes(end)) {
      throw this.invalidInput();
    }
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map(Number);
    return (hours * 60) + minutes;
  }

  private optionalId(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    return this.requiredId(value);
  }

  private requiredId(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw this.invalidInput();
    }
    return value.trim();
  }

  private weekday(value: unknown): PrismaWeekday {
    if (typeof value !== "string" || !ALLOWED_WEEKDAYS.has(value)) {
      throw this.invalidInput();
    }
    return value as PrismaWeekday;
  }

  private assertTenantSlug(tenant: TenantContext, businessSlug: string) {
    if (tenant.businessSlug !== businessSlug) {
      throw new ForbiddenException({
        code: "TENANT_BUSINESS_MISMATCH",
        message: "No tienes acceso a este negocio.",
      });
    }
  }

  private invalidInput(): BadRequestException {
    return new BadRequestException({
      code: "ADMIN_AVAILABILITY_INVALID_INPUT",
      message: "Los datos de disponibilidad no son validos.",
    });
  }
}
