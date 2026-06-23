import { Injectable, NotFoundException } from "@nestjs/common";

import { DatabaseService } from "../common/database/database.service";
import type { TenantContext } from "../common/types/request-user";

@Injectable()
export class BusinessProfessionalAvailabilityService {
  constructor(private readonly database: DatabaseService) {}

  async getAvailability(tenant: TenantContext, professionalId: string) {
    const client = this.database.getClient();
    const professional = await client.professional.findFirst({
      where: {
        id: professionalId,
        businessId: tenant.businessId,
      },
      select: {
        id: true,
        displayName: true,
        roleTitle: true,
        status: true,
        business: {
          select: {
            timezone: true,
          },
        },
      },
    });

    if (!professional) {
      throw new NotFoundException({
        code: "PROFESSIONAL_NOT_FOUND",
        message: "El profesional no existe en este negocio.",
      });
    }

    const professionalLocations = await client.professionalLocation.findMany({
      where: {
        businessId: tenant.businessId,
        professionalId,
        status: "ACTIVE",
        location: {
          status: "ACTIVE",
        },
      },
      select: {
        locationId: true,
        location: {
          select: {
            id: true,
            slug: true,
            name: true,
            timezone: true,
            status: true,
          },
        },
      },
      orderBy: [
        { locationId: "asc" },
        { id: "asc" },
      ],
    });
    const locationIds = professionalLocations.map(({ locationId }) => locationId);

    const [businessHours, weeklyRules, timeOff] = await Promise.all([
      client.businessHour.findMany({
        where: {
          businessId: tenant.businessId,
          status: "ACTIVE",
          OR: [
            { locationId: null },
            { locationId: { in: locationIds } },
          ],
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
      }),
      client.professionalAvailabilityRule.findMany({
        where: {
          businessId: tenant.businessId,
          professionalId,
          status: "ACTIVE",
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
      }),
      client.timeOff.findMany({
        where: {
          businessId: tenant.businessId,
          status: "ACTIVE",
          endsAt: {
            gte: new Date(),
          },
          OR: [
            { professionalId },
            { locationId: { in: locationIds } },
            { professionalId: null, locationId: null },
          ],
        },
        select: {
          id: true,
          locationId: true,
          startsAt: true,
          endsAt: true,
          status: true,
        },
        orderBy: [
          { startsAt: "asc" },
          { endsAt: "asc" },
          { id: "asc" },
        ],
      }),
    ]);

    return {
      professional: {
        id: professional.id,
        displayName: professional.displayName,
        roleTitle: professional.roleTitle,
        status: professional.status,
        isActive: professional.status === "ACTIVE",
      },
      timezone: {
        business: professional.business.timezone,
      },
      locations: professionalLocations.map(({ location }) => ({
        id: location.id,
        slug: location.slug,
        name: location.name,
        timezone: location.timezone ?? professional.business.timezone,
        status: location.status,
      })),
      businessHours,
      weeklyRules,
      timeOff: timeOff.map((entry) => ({
        id: entry.id,
        locationId: entry.locationId,
        startsAt: entry.startsAt.toISOString(),
        endsAt: entry.endsAt.toISOString(),
        status: entry.status,
      })),
    };
  }
}
