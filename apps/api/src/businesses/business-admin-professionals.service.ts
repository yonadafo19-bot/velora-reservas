import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AvailabilityStatus as PrismaAvailabilityStatus,
  ProfessionalStatus as PrismaProfessionalStatus,
} from "@velora/database";

import type { PrismaTransaction } from "../common/database/prisma-transaction";
import { TransactionService } from "../common/database/transaction.service";
import type { TenantContext } from "../common/types/request-user";

const ALLOWED_PROFESSIONAL_STATUSES = new Set(["ACTIVE", "INACTIVE", "ARCHIVED"]);
const ALLOWED_AVAILABILITY_STATUSES = new Set(["ACTIVE", "INACTIVE"]);

export interface AdminProfessionalCreateRequest {
  displayName: string;
  slug?: string;
  roleTitle?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  sortOrder?: number;
  serviceIds?: string[];
  locationIds?: string[];
}

export interface AdminProfessionalUpdateRequest {
  displayName?: string;
  slug?: string;
  roleTitle?: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
  sortOrder?: number;
  serviceIds?: string[];
  locationIds?: string[];
}

export interface AdminProfessionalServicesReplaceRequest {
  serviceIds: string[];
}

export interface AdminProfessionalLocationsReplaceRequest {
  locationIds: string[];
}

@Injectable()
export class BusinessAdminProfessionalsService {
  constructor(private readonly transactions: TransactionService) {}

  async listLocations(tenant: TenantContext, businessSlug: string) {
    this.assertTenantSlug(tenant, businessSlug);

    return this.transactions.runInTransaction(async (transaction) => {
      const locations = await transaction.location.findMany({
        where: {
          businessId: tenant.businessId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          slug: true,
          name: true,
          addressLine: true,
          city: true,
          status: true,
        },
        orderBy: [
          { name: "asc" },
          { id: "asc" },
        ],
      });

      return locations.map((location) => ({
        id: location.id,
        slug: location.slug,
        name: location.name,
        addressLine: location.addressLine,
        city: location.city,
        status: location.status,
      }));
    });
  }

  async createProfessional(
    tenant: TenantContext,
    businessSlug: string,
    body: AdminProfessionalCreateRequest,
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const input = this.validateCreateInput(body);
    const assignments = this.validateOptionalAssignments(body);

    return this.transactions.runInTransaction(async (transaction) => {
      await this.assertSlugAvailable(transaction, tenant.businessId, input.slug);
      await this.assertOptionalAssignmentsAvailable(transaction, tenant.businessId, assignments);

      const created = await transaction.professional.create({
        data: {
          businessId: tenant.businessId,
          displayName: input.displayName,
          slug: input.slug,
          roleTitle: input.roleTitle,
          bio: input.bio,
          phone: input.phone,
          email: input.email,
          status: input.status,
          sortOrder: input.sortOrder,
        },
        select: {
          id: true,
        },
      });

      if (assignments.serviceIds !== undefined) {
        await this.writeProfessionalServices(
          transaction,
          tenant.businessId,
          created.id,
          assignments.serviceIds,
        );
      }
      if (assignments.locationIds !== undefined) {
        await this.writeProfessionalLocations(
          transaction,
          tenant.businessId,
          created.id,
          assignments.locationIds,
        );
      }

      return this.getProfessionalResponse(transaction, tenant.businessId, created.id);
    });
  }

  async updateProfessional(
    tenant: TenantContext,
    businessSlug: string,
    professionalId: string,
    body: AdminProfessionalUpdateRequest,
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const input = this.validateUpdateInput(body);
    const assignments = this.validateOptionalAssignments(body);
    const hasProfessionalInput = Object.keys(input).length > 0;
    const hasAssignmentInput = assignments.serviceIds !== undefined
      || assignments.locationIds !== undefined;
    if (!hasProfessionalInput && !hasAssignmentInput) {
      throw this.invalidInput();
    }

    return this.transactions.runInTransaction(async (transaction) => {
      const existing = await this.getExistingProfessional(
        transaction,
        tenant.businessId,
        professionalId,
      );

      if (typeof input.slug === "string" && input.slug !== existing.slug) {
        await this.assertSlugAvailable(transaction, tenant.businessId, input.slug, existing.id);
      }
      await this.assertOptionalAssignmentsAvailable(transaction, tenant.businessId, assignments);

      if (hasProfessionalInput) {
        const updated = await transaction.professional.updateMany({
          where: {
            id: professionalId,
            businessId: tenant.businessId,
          },
          data: input,
        });

        if (updated.count !== 1) {
          throw this.professionalNotFound();
        }
      }

      if (assignments.serviceIds !== undefined) {
        await this.writeProfessionalServices(
          transaction,
          tenant.businessId,
          professionalId,
          assignments.serviceIds,
        );
      }
      if (assignments.locationIds !== undefined) {
        await this.writeProfessionalLocations(
          transaction,
          tenant.businessId,
          professionalId,
          assignments.locationIds,
        );
      }

      return this.getProfessionalResponse(transaction, tenant.businessId, professionalId);
    });
  }

  async replaceProfessionalServices(
    tenant: TenantContext,
    businessSlug: string,
    professionalId: string,
    body: AdminProfessionalServicesReplaceRequest,
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const serviceIds = this.validateServiceIdsInput(body);

    return this.transactions.runInTransaction(async (transaction) => {
      await this.getExistingProfessional(transaction, tenant.businessId, professionalId);
      await this.assertServicesAvailable(transaction, tenant.businessId, serviceIds);
      await this.writeProfessionalServices(transaction, tenant.businessId, professionalId, serviceIds);

      return this.getProfessionalResponse(transaction, tenant.businessId, professionalId);
    });
  }

  async replaceProfessionalLocations(
    tenant: TenantContext,
    businessSlug: string,
    professionalId: string,
    body: AdminProfessionalLocationsReplaceRequest,
  ) {
    this.assertTenantSlug(tenant, businessSlug);
    const locationIds = this.validateLocationIdsInput(body);

    return this.transactions.runInTransaction(async (transaction) => {
      await this.getExistingProfessional(transaction, tenant.businessId, professionalId);
      await this.assertLocationsAvailable(transaction, tenant.businessId, locationIds);
      await this.writeProfessionalLocations(transaction, tenant.businessId, professionalId, locationIds);

      return this.getProfessionalResponse(transaction, tenant.businessId, professionalId);
    });
  }

  private async writeProfessionalServices(
    transaction: PrismaTransaction,
    businessId: string,
    professionalId: string,
    serviceIds: string[],
  ) {
    await transaction.professionalService.updateMany({
      where: {
        businessId,
        professionalId,
        status: "ACTIVE",
        serviceId: {
          notIn: serviceIds,
        },
      },
      data: {
        status: "INACTIVE",
      },
    });

    for (const serviceId of serviceIds) {
      const existing = await transaction.professionalService.findFirst({
        where: {
          businessId,
          professionalId,
          serviceId,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        await transaction.professionalService.updateMany({
          where: {
            id: existing.id,
            businessId,
          },
          data: {
            status: "ACTIVE",
          },
        });
      } else {
        await transaction.professionalService.create({
          data: {
            businessId,
            professionalId,
            serviceId,
            status: "ACTIVE",
          },
        });
      }
    }
  }

  private async writeProfessionalLocations(
    transaction: PrismaTransaction,
    businessId: string,
    professionalId: string,
    locationIds: string[],
  ) {
    await transaction.professionalLocation.updateMany({
      where: {
        businessId,
        professionalId,
        status: "ACTIVE",
        locationId: {
          notIn: locationIds,
        },
      },
      data: {
        status: "INACTIVE",
      },
    });

    for (const locationId of locationIds) {
      const existing = await transaction.professionalLocation.findFirst({
        where: {
          businessId,
          professionalId,
          locationId,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        await transaction.professionalLocation.updateMany({
          where: {
            id: existing.id,
            businessId,
          },
          data: {
            status: "ACTIVE",
          },
        });
      } else {
        await transaction.professionalLocation.create({
          data: {
            businessId,
            professionalId,
            locationId,
            status: "ACTIVE",
          },
        });
      }
    }
  }

  private async getExistingProfessional(
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
        slug: true,
      },
    });

    if (!professional) {
      throw this.professionalNotFound();
    }

    return professional;
  }

  private async getProfessionalResponse(
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
        slug: true,
        displayName: true,
        roleTitle: true,
        bio: true,
        status: true,
        sortOrder: true,
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
        locations: {
          where: {
            status: "ACTIVE",
            location: {
              status: "ACTIVE",
            },
          },
          select: {
            location: {
              select: {
                id: true,
                slug: true,
                name: true,
                addressLine: true,
                city: true,
                status: true,
              },
            },
          },
          orderBy: [
            { locationId: "asc" },
            { id: "asc" },
          ],
        },
      },
    });

    if (!professional) {
      throw this.professionalNotFound();
    }

    return {
      id: professional.id,
      slug: professional.slug,
      displayName: professional.displayName,
      roleTitle: professional.roleTitle,
      bio: professional.bio,
      status: professional.status,
      isActive: professional.status === "ACTIVE",
      sortOrder: professional.sortOrder,
      services: professional.services.map(({ service }) => ({
        id: service.id,
        name: service.name,
      })),
      locations: professional.locations.map(({ location }) => ({
        id: location.id,
        slug: location.slug,
        name: location.name,
        addressLine: location.addressLine,
        city: location.city,
        status: location.status,
      })),
    };
  }

  private async assertSlugAvailable(
    transaction: PrismaTransaction,
    businessId: string,
    slug: string,
    ignoreProfessionalId?: string,
  ) {
    const existing = await transaction.professional.findFirst({
      where: {
        businessId,
        slug,
        ...(ignoreProfessionalId ? { id: { not: ignoreProfessionalId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_SLUG_DUPLICATED",
        message: "Ya existe un profesional con ese slug.",
      });
    }
  }

  private async assertServicesAvailable(
    transaction: PrismaTransaction,
    businessId: string,
    serviceIds: string[],
  ) {
    const services = await transaction.service.findMany({
      where: {
        businessId,
        id: {
          in: serviceIds,
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    const foundIds = new Set(services.map((service) => service.id));

    if (!serviceIds.every((serviceId) => foundIds.has(serviceId))) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_SERVICE_INVALID",
        message: "Uno o mas servicios no estan disponibles para este negocio.",
      });
    }
  }

  private async assertLocationsAvailable(
    transaction: PrismaTransaction,
    businessId: string,
    locationIds: string[],
  ) {
    const locations = await transaction.location.findMany({
      where: {
        businessId,
        id: {
          in: locationIds,
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
    const foundIds = new Set(locations.map((location) => location.id));

    if (!locationIds.every((locationId) => foundIds.has(locationId))) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_LOCATION_INVALID",
        message: "Una o mas sucursales no estan disponibles para este negocio.",
      });
    }
  }

  private async assertOptionalAssignmentsAvailable(
    transaction: PrismaTransaction,
    businessId: string,
    assignments: {
      serviceIds?: string[];
      locationIds?: string[];
    },
  ) {
    if (assignments.serviceIds !== undefined) {
      await this.assertServicesAvailable(transaction, businessId, assignments.serviceIds);
    }
    if (assignments.locationIds !== undefined) {
      await this.assertLocationsAvailable(transaction, businessId, assignments.locationIds);
    }
  }

  private validateCreateInput(body: AdminProfessionalCreateRequest) {
    if (!body || typeof body !== "object") {
      throw this.invalidInput();
    }

    const displayName = this.requiredString(body.displayName);

    return {
      displayName,
      slug: this.slug(body.slug ?? displayName),
      roleTitle: this.optionalString(body.roleTitle),
      bio: this.optionalString(body.bio),
      phone: this.optionalString(body.phone),
      email: this.optionalString(body.email),
      status: this.professionalStatus(body.status ?? "ACTIVE"),
      sortOrder: this.integer(body.sortOrder ?? 0),
    };
  }

  private validateUpdateInput(body: AdminProfessionalUpdateRequest) {
    if (!body || typeof body !== "object") {
      throw this.invalidInput();
    }

    const input: Record<string, unknown> = {};
    if (body.displayName !== undefined) {
      input.displayName = this.requiredString(body.displayName);
    }
    if (body.slug !== undefined) {
      input.slug = this.slug(body.slug);
    }
    if (body.roleTitle !== undefined) {
      input.roleTitle = this.optionalString(body.roleTitle);
    }
    if (body.bio !== undefined) {
      input.bio = this.optionalString(body.bio);
    }
    if (body.phone !== undefined) {
      input.phone = this.optionalString(body.phone);
    }
    if (body.email !== undefined) {
      input.email = this.optionalString(body.email);
    }
    if (body.status !== undefined) {
      input.status = this.professionalStatus(body.status);
    }
    if (body.sortOrder !== undefined) {
      input.sortOrder = this.integer(body.sortOrder);
    }

    return input;
  }

  private validateServiceIdsInput(body: AdminProfessionalServicesReplaceRequest): string[] {
    if (!body || typeof body !== "object" || !Array.isArray(body.serviceIds)) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_SERVICES_INVALID_INPUT",
        message: "Los servicios del profesional no son validos.",
      });
    }
    if (!body.serviceIds.every((serviceId) => this.isNonEmptyString(serviceId))) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_SERVICES_INVALID_INPUT",
        message: "Los servicios del profesional no son validos.",
      });
    }
    if (new Set(body.serviceIds).size !== body.serviceIds.length) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_SERVICES_DUPLICATED",
        message: "No repitas servicios para el mismo profesional.",
      });
    }

    return body.serviceIds.map((serviceId) => serviceId.trim());
  }

  private validateOptionalAssignments(
    body: AdminProfessionalCreateRequest | AdminProfessionalUpdateRequest,
  ): {
    serviceIds?: string[];
    locationIds?: string[];
  } {
    return {
      ...(body.serviceIds !== undefined
        ? { serviceIds: this.validateServiceIdsInput({ serviceIds: body.serviceIds }) }
        : {}),
      ...(body.locationIds !== undefined
        ? { locationIds: this.validateLocationIdsInput({ locationIds: body.locationIds }) }
        : {}),
    };
  }

  private validateLocationIdsInput(body: AdminProfessionalLocationsReplaceRequest): string[] {
    if (!body || typeof body !== "object" || !Array.isArray(body.locationIds)) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_LOCATIONS_INVALID_INPUT",
        message: "Las sucursales del profesional no son validas.",
      });
    }
    if (!body.locationIds.every((locationId) => this.isNonEmptyString(locationId))) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_LOCATIONS_INVALID_INPUT",
        message: "Las sucursales del profesional no son validas.",
      });
    }
    if (new Set(body.locationIds).size !== body.locationIds.length) {
      throw new BadRequestException({
        code: "ADMIN_PROFESSIONAL_LOCATIONS_DUPLICATED",
        message: "No repitas sucursales para el mismo profesional.",
      });
    }

    return body.locationIds.map((locationId) => locationId.trim());
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

  private integer(value: unknown): number {
    if (!Number.isInteger(value)) {
      throw this.invalidInput();
    }
    return value as number;
  }

  private professionalStatus(value: unknown): PrismaProfessionalStatus {
    if (typeof value !== "string" || !ALLOWED_PROFESSIONAL_STATUSES.has(value)) {
      throw this.invalidInput();
    }
    return value as PrismaProfessionalStatus;
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
  }

  private professionalNotFound(): NotFoundException {
    return new NotFoundException({
      code: "ADMIN_PROFESSIONAL_NOT_FOUND",
      message: "El profesional no existe en este negocio.",
    });
  }

  private invalidInput(): BadRequestException {
    return new BadRequestException({
      code: "ADMIN_PROFESSIONAL_INVALID_INPUT",
      message: "Los datos del profesional no son validos.",
    });
  }
}

export function normalizeAvailabilityStatus(value: unknown): PrismaAvailabilityStatus {
  if (typeof value !== "string" || !ALLOWED_AVAILABILITY_STATUSES.has(value)) {
    throw new BadRequestException({
      code: "ADMIN_AVAILABILITY_INVALID_INPUT",
      message: "Los datos de disponibilidad no son validos.",
    });
  }
  return value as PrismaAvailabilityStatus;
}
