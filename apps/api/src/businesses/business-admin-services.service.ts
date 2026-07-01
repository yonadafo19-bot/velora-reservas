import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { CatalogStatus as PrismaCatalogStatus } from "@velora/database";

import type { PrismaTransaction } from "../common/database/prisma-transaction";
import { TransactionService } from "../common/database/transaction.service";
import type { TenantContext } from "../common/types/request-user";

const ALLOWED_CATALOG_STATUSES = new Set(["ACTIVE", "INACTIVE", "ARCHIVED"]);

export interface AdminServiceCreateRequest {
  name: string;
  slug?: string;
  description?: string | null;
  basePriceClp: number;
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  categoryId?: string | null;
  status?: string;
  isMainService?: boolean;
  sortOrder?: number;
}

export interface AdminServiceUpdateRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  basePriceClp?: number;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  categoryId?: string | null;
  status?: string;
  isMainService?: boolean;
  sortOrder?: number;
}

@Injectable()
export class BusinessAdminServicesService {
  constructor(private readonly transactions: TransactionService) {}

  async createService(
    tenant: TenantContext,
    businessSlug: string,
    body: AdminServiceCreateRequest,
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const input = this.validateCreateInput(body);

    return this.transactions.runInTransaction(async (transaction) => {
      if (input.categoryId) {
        await this.assertCategoryExists(transaction, tenant.businessId, input.categoryId);
      }
      await this.assertSlugAvailable(transaction, tenant.businessId, input.slug);

      const created = await transaction.service.create({
        data: {
          businessId: tenant.businessId,
          categoryId: input.categoryId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          basePriceClp: input.basePriceClp,
          durationMinutes: input.durationMinutes,
          bufferBeforeMinutes: input.bufferBeforeMinutes,
          bufferAfterMinutes: input.bufferAfterMinutes,
          status: input.status as PrismaCatalogStatus,
          isMainService: input.isMainService,
          sortOrder: input.sortOrder,
        },
        select: {
          id: true,
        },
      });

      return this.getServiceResponse(transaction, tenant.businessId, created.id);
    });
  }

  async updateService(
    tenant: TenantContext,
    businessSlug: string,
    serviceId: string,
    body: AdminServiceUpdateRequest,
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const input = this.validateUpdateInput(body);

    return this.transactions.runInTransaction(async (transaction) => {
      const existing = await transaction.service.findFirst({
        where: {
          id: serviceId,
          businessId: tenant.businessId,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      if (!existing) {
        throw new NotFoundException({
          code: "ADMIN_SERVICE_NOT_FOUND",
          message: "El servicio no existe en este negocio.",
        });
      }

      if (typeof input.categoryId === "string") {
        await this.assertCategoryExists(transaction, tenant.businessId, input.categoryId);
      }
      if (typeof input.slug === "string" && input.slug !== existing.slug) {
        await this.assertSlugAvailable(transaction, tenant.businessId, input.slug, existing.id);
      }

      const updated = await transaction.service.updateMany({
        where: {
          id: serviceId,
          businessId: tenant.businessId,
        },
        data: input,
      });

      if (updated.count !== 1) {
        throw new NotFoundException({
          code: "ADMIN_SERVICE_NOT_FOUND",
          message: "El servicio no existe en este negocio.",
        });
      }

      return this.getServiceResponse(transaction, tenant.businessId, serviceId);
    });
  }

  private async getServiceResponse(
    transaction: PrismaTransaction,
    businessId: string,
    serviceId: string,
  ) {
    const service = await transaction.service.findFirst({
      where: {
        id: serviceId,
        businessId,
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
    });

    if (!service) {
      throw new NotFoundException({
        code: "ADMIN_SERVICE_NOT_FOUND",
        message: "El servicio no existe en este negocio.",
      });
    }

    return {
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
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
    };
  }

  private async assertCategoryExists(
    transaction: PrismaTransaction,
    businessId: string,
    categoryId: string,
  ) {
    const category = await transaction.serviceCategory.findFirst({
      where: {
        id: categoryId,
        businessId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException({
        code: "ADMIN_SERVICE_CATEGORY_NOT_FOUND",
        message: "La categoria del servicio no existe en este negocio.",
      });
    }
  }

  private async assertSlugAvailable(
    transaction: PrismaTransaction,
    businessId: string,
    slug: string,
    ignoreServiceId?: string,
  ) {
    const existing = await transaction.service.findFirst({
      where: {
        businessId,
        slug,
        ...(ignoreServiceId ? { id: { not: ignoreServiceId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new BadRequestException({
        code: "ADMIN_SERVICE_SLUG_DUPLICATED",
        message: "Ya existe un servicio con ese slug.",
      });
    }
  }

  private validateCreateInput(body: AdminServiceCreateRequest) {
    if (!body || typeof body !== "object") {
      throw this.invalidInput();
    }

    const name = this.requiredString(body.name);
    const slug = this.slug(body.slug ?? name);
    const status = this.catalogStatus(body.status ?? "ACTIVE");

    return {
      name,
      slug,
      description: this.optionalString(body.description),
      basePriceClp: this.nonNegativeInteger(body.basePriceClp),
      durationMinutes: this.positiveInteger(body.durationMinutes),
      bufferBeforeMinutes: this.nonNegativeInteger(body.bufferBeforeMinutes ?? 0),
      bufferAfterMinutes: this.nonNegativeInteger(body.bufferAfterMinutes ?? 0),
      categoryId: this.optionalId(body.categoryId),
      status,
      isMainService: this.optionalBoolean(body.isMainService, true),
      sortOrder: this.integer(body.sortOrder ?? 0),
    };
  }

  private validateUpdateInput(body: AdminServiceUpdateRequest) {
    if (!body || typeof body !== "object") {
      throw this.invalidInput();
    }

    const input: Record<string, unknown> = {};
    if (body.name !== undefined) {
      input.name = this.requiredString(body.name);
    }
    if (body.slug !== undefined) {
      input.slug = this.slug(body.slug);
    }
    if (body.description !== undefined) {
      input.description = this.optionalString(body.description);
    }
    if (body.basePriceClp !== undefined) {
      input.basePriceClp = this.nonNegativeInteger(body.basePriceClp);
    }
    if (body.durationMinutes !== undefined) {
      input.durationMinutes = this.positiveInteger(body.durationMinutes);
    }
    if (body.bufferBeforeMinutes !== undefined) {
      input.bufferBeforeMinutes = this.nonNegativeInteger(body.bufferBeforeMinutes);
    }
    if (body.bufferAfterMinutes !== undefined) {
      input.bufferAfterMinutes = this.nonNegativeInteger(body.bufferAfterMinutes);
    }
    if (body.categoryId !== undefined) {
      input.categoryId = this.optionalId(body.categoryId);
    }
    if (body.status !== undefined) {
      input.status = this.catalogStatus(body.status);
    }
    if (body.isMainService !== undefined) {
      input.isMainService = this.optionalBoolean(body.isMainService, true);
    }
    if (body.sortOrder !== undefined) {
      input.sortOrder = this.integer(body.sortOrder);
    }

    if (Object.keys(input).length === 0) {
      throw this.invalidInput();
    }

    return input;
  }

  private assertTenantSlug(tenant: TenantContext, businessSlug: string) {
    if (tenant.businessSlug !== businessSlug) {
      throw new ForbiddenException({
        code: "TENANT_BUSINESS_MISMATCH",
        message: "No tienes acceso a este negocio.",
      });
    }
  }

  private requiredString(value: unknown): string {
    if (typeof value !== "string") {
      throw this.invalidInput();
    }
    const normalized = value.trim();
    if (normalized.length === 0 || normalized.length > 160) {
      throw this.invalidInput();
    }
    return normalized;
  }

  private optionalString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value !== "string") {
      throw this.invalidInput();
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private optionalId(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      throw this.invalidInput();
    }
    return value.trim();
  }

  private slug(value: unknown): string {
    if (typeof value !== "string") {
      throw this.invalidInput();
    }
    const normalized = value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);

    if (normalized.length === 0) {
      throw this.invalidInput();
    }
    return normalized;
  }

  private nonNegativeInteger(value: unknown): number {
    const numberValue = this.integer(value);
    if (numberValue < 0) {
      throw this.invalidInput();
    }
    return numberValue;
  }

  private positiveInteger(value: unknown): number {
    const numberValue = this.integer(value);
    if (numberValue <= 0) {
      throw this.invalidInput();
    }
    return numberValue;
  }

  private integer(value: unknown): number {
    if (!Number.isInteger(value)) {
      throw this.invalidInput();
    }
    return value as number;
  }

  private optionalBoolean(value: unknown, defaultValue: boolean): boolean {
    if (value === undefined) {
      return defaultValue;
    }
    if (typeof value !== "boolean") {
      throw this.invalidInput();
    }
    return value;
  }

  private catalogStatus(value: unknown): PrismaCatalogStatus {
    if (typeof value !== "string" || !ALLOWED_CATALOG_STATUSES.has(value)) {
      throw this.invalidInput();
    }
    return value as PrismaCatalogStatus;
  }

  private invalidInput(): BadRequestException {
    return new BadRequestException({
      code: "ADMIN_SERVICE_INVALID_INPUT",
      message: "Los datos del servicio no son validos.",
    });
  }
}
