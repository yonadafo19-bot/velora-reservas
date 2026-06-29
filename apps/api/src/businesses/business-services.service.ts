import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../common/database/database.service";
import type { TenantContext } from "../common/types/request-user";

@Injectable()
export class BusinessServicesService {
  constructor(private readonly database: DatabaseService) {}

  async listServices(tenant: TenantContext) {
    const services = await this.database.getClient().service.findMany({
      where: {
        businessId: tenant.businessId,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        durationMinutes: true,
        basePriceClp: true,
        bufferBeforeMinutes: true,
        bufferAfterMinutes: true,
        categoryId: true,
        status: true,
        isMainService: true,
        sortOrder: true,
        category: {
          select: {
            name: true,
          },
        },
        business: {
          select: {
            currency: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
        { id: "asc" },
      ],
    });

    return services.map((service) => ({
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
      basePriceClp: service.basePriceClp,
      durationMinutes: service.durationMinutes,
      priceFrom: service.basePriceClp,
      priceTo: service.basePriceClp,
      currency: service.business.currency,
      bufferBeforeMinutes: service.bufferBeforeMinutes,
      bufferAfterMinutes: service.bufferAfterMinutes,
      categoryId: service.categoryId,
      categoryName: service.category?.name ?? null,
      status: service.status,
      isActive: service.status === "ACTIVE",
      isMainService: service.isMainService,
      sortOrder: service.sortOrder,
    }));
  }
}
