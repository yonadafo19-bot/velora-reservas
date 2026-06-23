import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../common/database/database.service";
import type { TenantContext } from "../common/types/request-user";

@Injectable()
export class BusinessProfessionalsService {
  constructor(private readonly database: DatabaseService) {}

  async listProfessionals(tenant: TenantContext) {
    const professionals = await this.database.getClient().professional.findMany({
      where: {
        businessId: tenant.businessId,
      },
      select: {
        id: true,
        displayName: true,
        roleTitle: true,
        bio: true,
        status: true,
        services: {
          where: {
            status: "ACTIVE",
            service: {
              status: "ACTIVE",
            },
          },
          select: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [
            { service: { sortOrder: "asc" } },
            { service: { name: "asc" } },
            { service: { id: "asc" } },
          ],
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { displayName: "asc" },
        { id: "asc" },
      ],
    });

    return professionals.map((professional) => ({
      id: professional.id,
      displayName: professional.displayName,
      roleTitle: professional.roleTitle,
      bio: professional.bio,
      status: professional.status,
      isActive: professional.status === "ACTIVE",
      services: professional.services.map(({ service }) => ({
        id: service.id,
        name: service.name,
      })),
    }));
  }
}
