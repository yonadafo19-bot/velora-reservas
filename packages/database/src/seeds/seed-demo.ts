import {
  AvailabilityStatus,
  BusinessStatus,
  CatalogStatus,
  LocationStatus,
  MembershipRole,
  MembershipStatus,
  Prisma,
  ProductRecommendationStatus,
  ProductStatus,
  ProfessionalStatus,
  ResourceStatus,
  ResourceTypeStatus,
  UserStatus,
} from "../generated/prisma/client.js";
import type { DemoSeedDefinition } from "./demo-seed.types.js";

const TIMEZONE = "America/Santiago";
const CURRENCY = "CLP";

function seedId(definition: DemoSeedDefinition, entity: string, key: string): string {
  return `seed-${definition.key}-${entity}-${key}`;
}

export async function seedDemoBusiness(
  transaction: Prisma.TransactionClient,
  definition: DemoSeedDefinition,
): Promise<void> {
  const business = await transaction.business.upsert({
    where: { slug: definition.business.slug },
    update: {
      name: definition.business.name,
      vertical: definition.business.vertical,
      timezone: TIMEZONE,
      currency: CURRENCY,
      status: BusinessStatus.ACTIVE,
    },
    create: {
      id: seedId(definition, "business", "main"),
      slug: definition.business.slug,
      name: definition.business.name,
      vertical: definition.business.vertical,
      timezone: TIMEZONE,
      currency: CURRENCY,
      status: BusinessStatus.ACTIVE,
    },
  });

  const location = await transaction.location.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: definition.location.slug,
      },
    },
    update: {
      name: definition.location.name,
      addressLine: definition.location.addressLine,
      city: "Santiago",
      region: "Región Metropolitana",
      timezone: TIMEZONE,
      phone: definition.location.phone,
      whatsappPhone: definition.location.phone,
      status: LocationStatus.ACTIVE,
    },
    create: {
      id: seedId(definition, "location", "main"),
      businessId: business.id,
      slug: definition.location.slug,
      name: definition.location.name,
      addressLine: definition.location.addressLine,
      city: "Santiago",
      region: "Región Metropolitana",
      timezone: TIMEZONE,
      phone: definition.location.phone,
      whatsappPhone: definition.location.phone,
      status: LocationStatus.ACTIVE,
    },
  });

  const owner = await transaction.user.upsert({
    where: { authSubject: "development:velora-demo-owner" },
    update: {
      email: "owner.demo@velora.invalid",
      displayName: "Administración Velora Demo",
      status: UserStatus.ACTIVE,
    },
    create: {
      id: "seed-user-demo-owner",
      authSubject: "development:velora-demo-owner",
      email: "owner.demo@velora.invalid",
      displayName: "Administración Velora Demo",
      status: UserStatus.ACTIVE,
    },
  });

  await transaction.membership.upsert({
    where: {
      businessId_userId: { businessId: business.id, userId: owner.id },
    },
    update: { role: MembershipRole.OWNER, status: MembershipStatus.ACTIVE },
    create: {
      id: seedId(definition, "membership", "owner"),
      businessId: business.id,
      userId: owner.id,
      role: MembershipRole.OWNER,
      status: MembershipStatus.ACTIVE,
    },
  });

  const categoryIds = new Map<string, string>();
  for (const [index, category] of definition.serviceCategories.entries()) {
    const saved = await transaction.serviceCategory.upsert({
      where: {
        businessId_slug: { businessId: business.id, slug: category.slug },
      },
      update: { name: category.name, sortOrder: index, status: CatalogStatus.ACTIVE },
      create: {
        id: seedId(definition, "service-category", category.slug),
        businessId: business.id,
        slug: category.slug,
        name: category.name,
        sortOrder: index,
        status: CatalogStatus.ACTIVE,
      },
    });
    categoryIds.set(category.slug, saved.id);
  }

  const serviceIds = new Map<string, string>();
  for (const [index, service] of definition.services.entries()) {
    const categoryId = categoryIds.get(service.categorySlug);
    if (!categoryId) throw new Error(`Categoría de servicio no encontrada: ${service.categorySlug}`);

    const saved = await transaction.service.upsert({
      where: { businessId_slug: { businessId: business.id, slug: service.slug } },
      update: {
        categoryId,
        name: service.name,
        description: service.description,
        basePriceClp: service.priceClp,
        durationMinutes: service.durationMinutes,
        status: CatalogStatus.ACTIVE,
        isMainService: true,
        sortOrder: index,
      },
      create: {
        id: seedId(definition, "service", service.slug),
        businessId: business.id,
        categoryId,
        slug: service.slug,
        name: service.name,
        description: service.description,
        basePriceClp: service.priceClp,
        durationMinutes: service.durationMinutes,
        status: CatalogStatus.ACTIVE,
        isMainService: true,
        sortOrder: index,
      },
    });
    serviceIds.set(service.slug, saved.id);
  }

  for (const [index, customer] of definition.customers.entries()) {
    await transaction.customer.upsert({
      where: { id: seedId(definition, "customer", customer.key) },
      update: {
        businessId: business.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        loyaltyTier: customer.loyaltyTier,
        priorityScore: customer.priorityScore,
        isManualVip: customer.isManualVip,
        preferencesNotes: customer.preferencesNotes,
      },
      create: {
        id: seedId(definition, "customer", customer.key),
        businessId: business.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        loyaltyTier: customer.loyaltyTier,
        priorityScore: customer.priorityScore,
        isManualVip: customer.isManualVip,
        preferencesNotes: customer.preferencesNotes,
        internalNotes: index === 2 ? "Registro ficticio para demostración de prioridad." : undefined,
      },
    });
  }

  const professionalIds = new Map<string, string>();
  for (const [index, professional] of definition.professionals.entries()) {
    const saved = await transaction.professional.upsert({
      where: { businessId_slug: { businessId: business.id, slug: professional.slug } },
      update: {
        displayName: professional.displayName,
        roleTitle: professional.roleTitle,
        bio: "Perfil ficticio creado exclusivamente para la demostración de Velora.",
        status: ProfessionalStatus.ACTIVE,
        sortOrder: index,
      },
      create: {
        id: seedId(definition, "professional", professional.slug),
        businessId: business.id,
        slug: professional.slug,
        displayName: professional.displayName,
        roleTitle: professional.roleTitle,
        bio: "Perfil ficticio creado exclusivamente para la demostración de Velora.",
        status: ProfessionalStatus.ACTIVE,
        sortOrder: index,
      },
    });
    professionalIds.set(professional.slug, saved.id);

    await transaction.professionalLocation.upsert({
      where: {
        businessId_professionalId_locationId: {
          businessId: business.id,
          professionalId: saved.id,
          locationId: location.id,
        },
      },
      update: { status: AvailabilityStatus.ACTIVE },
      create: {
        id: seedId(definition, "professional-location", professional.slug),
        businessId: business.id,
        professionalId: saved.id,
        locationId: location.id,
        status: AvailabilityStatus.ACTIVE,
      },
    });

    for (const serviceSlug of professional.serviceSlugs) {
      const serviceId = serviceIds.get(serviceSlug);
      if (!serviceId) throw new Error(`Servicio profesional no encontrado: ${serviceSlug}`);
      await transaction.professionalService.upsert({
        where: {
          businessId_professionalId_serviceId: {
            businessId: business.id,
            professionalId: saved.id,
            serviceId,
          },
        },
        update: { status: AvailabilityStatus.ACTIVE },
        create: {
          id: seedId(definition, "professional-service", `${professional.slug}-${serviceSlug}`),
          businessId: business.id,
          professionalId: saved.id,
          serviceId,
          status: AvailabilityStatus.ACTIVE,
        },
      });
    }
  }

  for (const hour of definition.businessHours) {
    await transaction.businessHour.upsert({
      where: { id: seedId(definition, "business-hour", hour.weekday.toLowerCase()) },
      update: {
        businessId: business.id,
        locationId: location.id,
        weekday: hour.weekday,
        opensAtLocal: hour.opensAtLocal,
        closesAtLocal: hour.closesAtLocal,
        status: AvailabilityStatus.ACTIVE,
      },
      create: {
        id: seedId(definition, "business-hour", hour.weekday.toLowerCase()),
        businessId: business.id,
        locationId: location.id,
        weekday: hour.weekday,
        opensAtLocal: hour.opensAtLocal,
        closesAtLocal: hour.closesAtLocal,
        status: AvailabilityStatus.ACTIVE,
      },
    });

    for (const [professionalSlug, professionalId] of professionalIds) {
      await transaction.professionalAvailabilityRule.upsert({
        where: {
          id: seedId(definition, "availability", `${professionalSlug}-${hour.weekday.toLowerCase()}`),
        },
        update: {
          businessId: business.id,
          professionalId,
          locationId: location.id,
          weekday: hour.weekday,
          startsAtLocal: hour.opensAtLocal,
          endsAtLocal: hour.closesAtLocal,
          status: AvailabilityStatus.ACTIVE,
        },
        create: {
          id: seedId(definition, "availability", `${professionalSlug}-${hour.weekday.toLowerCase()}`),
          businessId: business.id,
          professionalId,
          locationId: location.id,
          weekday: hour.weekday,
          startsAtLocal: hour.opensAtLocal,
          endsAtLocal: hour.closesAtLocal,
          status: AvailabilityStatus.ACTIVE,
        },
      });
    }
  }

  for (const [index, pack] of definition.packs.entries()) {
    const saved = await transaction.pack.upsert({
      where: { businessId_slug: { businessId: business.id, slug: pack.slug } },
      update: { name: pack.name, description: pack.description, priceClp: pack.priceClp, status: CatalogStatus.ACTIVE, sortOrder: index },
      create: { id: seedId(definition, "pack", pack.slug), businessId: business.id, slug: pack.slug, name: pack.name, description: pack.description, priceClp: pack.priceClp, status: CatalogStatus.ACTIVE, sortOrder: index },
    });

    for (const [sequence, serviceSlug] of pack.serviceSlugs.entries()) {
      const serviceId = serviceIds.get(serviceSlug);
      if (!serviceId) throw new Error(`Servicio de pack no encontrado: ${serviceSlug}`);
      await transaction.packItem.upsert({
        where: { id: seedId(definition, "pack-item", `${pack.slug}-${sequence + 1}`) },
        update: { businessId: business.id, packId: saved.id, serviceId, sequence: sequence + 1, quantity: 1 },
        create: { id: seedId(definition, "pack-item", `${pack.slug}-${sequence + 1}`), businessId: business.id, packId: saved.id, serviceId, sequence: sequence + 1, quantity: 1 },
      });
    }
  }

  const productCategoryIds = new Map<string, string>();
  for (const [index, category] of definition.productCategories.entries()) {
    const saved = await transaction.productCategory.upsert({
      where: { businessId_slug: { businessId: business.id, slug: category.slug } },
      update: { name: category.name, sortOrder: index, status: ProductStatus.ACTIVE },
      create: { id: seedId(definition, "product-category", category.slug), businessId: business.id, slug: category.slug, name: category.name, sortOrder: index, status: ProductStatus.ACTIVE },
    });
    productCategoryIds.set(category.slug, saved.id);
  }

  const productIds = new Map<string, string>();
  for (const [index, product] of definition.products.entries()) {
    const categoryId = productCategoryIds.get(product.categorySlug);
    if (!categoryId) throw new Error(`Categoría de producto no encontrada: ${product.categorySlug}`);
    const saved = await transaction.product.upsert({
      where: { businessId_slug: { businessId: business.id, slug: product.slug } },
      update: { categoryId, sku: product.sku, name: product.name, description: product.description, priceClp: product.priceClp, tracksInventory: true, status: ProductStatus.ACTIVE, sortOrder: index },
      create: { id: seedId(definition, "product", product.slug), businessId: business.id, categoryId, sku: product.sku, slug: product.slug, name: product.name, description: product.description, priceClp: product.priceClp, tracksInventory: true, status: ProductStatus.ACTIVE, sortOrder: index },
    });
    productIds.set(product.slug, saved.id);

    await transaction.productInventory.upsert({
      where: { businessId_productId_locationId: { businessId: business.id, productId: saved.id, locationId: location.id } },
      update: { onHand: product.onHand, reserved: 0, reorderPoint: product.reorderPoint },
      create: { id: seedId(definition, "inventory", product.slug), businessId: business.id, productId: saved.id, locationId: location.id, onHand: product.onHand, reserved: 0, reorderPoint: product.reorderPoint },
    });
  }

  for (const recommendation of definition.recommendations) {
    const serviceId = serviceIds.get(recommendation.serviceSlug);
    const productId = productIds.get(recommendation.productSlug);
    if (!serviceId || !productId) throw new Error("Recomendación con servicio o producto inexistente.");
    await transaction.productRecommendation.upsert({
      where: { businessId_serviceId_productId: { businessId: business.id, serviceId, productId } },
      update: { message: recommendation.message, priority: 10, status: ProductRecommendationStatus.ACTIVE },
      create: { id: seedId(definition, "recommendation", `${recommendation.serviceSlug}-${recommendation.productSlug}`), businessId: business.id, serviceId, productId, message: recommendation.message, priority: 10, status: ProductRecommendationStatus.ACTIVE },
    });
  }

  for (const resource of definition.resources) {
    const resourceType = await transaction.resourceType.upsert({
      where: { businessId_slug: { businessId: business.id, slug: resource.slug } },
      update: { name: resource.name, status: ResourceTypeStatus.ACTIVE },
      create: { id: seedId(definition, "resource-type", resource.slug), businessId: business.id, slug: resource.slug, name: resource.name, status: ResourceTypeStatus.ACTIVE },
    });
    await transaction.resource.upsert({
      where: { businessId_locationId_slug: { businessId: business.id, locationId: location.id, slug: resource.slug } },
      update: { resourceTypeId: resourceType.id, name: resource.name, capacity: 1, status: ResourceStatus.ACTIVE },
      create: { id: seedId(definition, "resource", resource.slug), businessId: business.id, locationId: location.id, resourceTypeId: resourceType.id, slug: resource.slug, name: resource.name, capacity: 1, status: ResourceStatus.ACTIVE },
    });

    for (const serviceSlug of resource.serviceSlugs) {
      const serviceId = serviceIds.get(serviceSlug);
      if (!serviceId) throw new Error(`Servicio de recurso no encontrado: ${serviceSlug}`);
      await transaction.serviceResourceRequirement.upsert({
        where: { businessId_serviceId_resourceTypeId: { businessId: business.id, serviceId, resourceTypeId: resourceType.id } },
        update: { quantity: 1 },
        create: { id: seedId(definition, "resource-requirement", `${serviceSlug}-${resource.slug}`), businessId: business.id, serviceId, resourceTypeId: resourceType.id, quantity: 1 },
      });
    }
  }
}
