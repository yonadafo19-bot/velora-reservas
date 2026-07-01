const assert = require("node:assert/strict");
const { test } = require("node:test");

const { BusinessServicesService } = require("../dist/businesses/business-services.service.js");

function tenantContext() {
  return {
    businessId: "business-tenant-1",
    businessSlug: "velora-barberia-demo",
    businessName: "Velora Barberia Demo",
    businessVertical: "BARBERSHOP",
    membershipId: "membership-1",
    role: "OWNER",
    userId: "user-1",
    email: "owner@example.invalid",
    authSubject: "supabase-subject",
    requestId: "request-1",
  };
}

function serviceWithMockedDatabase(rows) {
  let query;
  const database = {
    getClient: () => ({
      service: {
        findMany: async (receivedQuery) => {
          query = receivedQuery;
          return rows;
        },
      },
    }),
  };

  return {
    service: new BusinessServicesService(database),
    getQuery: () => query,
  };
}

test("business services consulta Prisma usando businessId desde TenantContext", async () => {
  const { service, getQuery } = serviceWithMockedDatabase([]);

  await service.listServices(tenantContext());

  assert.deepEqual(getQuery().where, {
    businessId: "business-tenant-1",
  });
  assert.deepEqual(getQuery().orderBy, [
    { sortOrder: "asc" },
    { name: "asc" },
    { id: "asc" },
  ]);
});

test("business services selecciona solo campos necesarios", async () => {
  const { service, getQuery } = serviceWithMockedDatabase([]);

  await service.listServices(tenantContext());

  assert.deepEqual(getQuery().select, {
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
  });
});

test("business services mapea precio, moneda, categoria e isActive", async () => {
  const { service } = serviceWithMockedDatabase([
    {
      id: "service-1",
      slug: "corte-clasico",
      name: "Corte clasico",
      description: "Corte personalizado y terminaciones.",
      durationMinutes: 40,
      basePriceClp: 18000,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      categoryId: "category-1",
      status: "ACTIVE",
      isMainService: true,
      sortOrder: 1,
      category: { name: "Cortes" },
      business: { currency: "CLP" },
    },
    {
      id: "service-2",
      slug: "servicio-archivado",
      name: "Servicio archivado",
      description: null,
      durationMinutes: 30,
      basePriceClp: 12000,
      bufferBeforeMinutes: 10,
      bufferAfterMinutes: 15,
      categoryId: null,
      status: "ARCHIVED",
      isMainService: false,
      sortOrder: 2,
      category: null,
      business: { currency: "CLP" },
    },
  ]);

  assert.deepEqual(await service.listServices(tenantContext()), [
    {
      id: "service-1",
      slug: "corte-clasico",
      name: "Corte clasico",
      description: "Corte personalizado y terminaciones.",
      basePriceClp: 18000,
      durationMinutes: 40,
      priceFrom: 18000,
      priceTo: 18000,
      currency: "CLP",
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      categoryId: "category-1",
      categoryName: "Cortes",
      status: "ACTIVE",
      isActive: true,
      isMainService: true,
      sortOrder: 1,
    },
    {
      id: "service-2",
      slug: "servicio-archivado",
      name: "Servicio archivado",
      description: null,
      basePriceClp: 12000,
      durationMinutes: 30,
      priceFrom: 12000,
      priceTo: 12000,
      currency: "CLP",
      bufferBeforeMinutes: 10,
      bufferAfterMinutes: 15,
      categoryId: null,
      categoryName: null,
      status: "ARCHIVED",
      isActive: false,
      isMainService: false,
      sortOrder: 2,
    },
  ]);
});

test("business services no expone campos sensibles del contexto ni businessId", async () => {
  const { service } = serviceWithMockedDatabase([
    {
      id: "service-1",
      slug: "corte-clasico",
      name: "Corte clasico",
      description: "Corte personalizado y terminaciones.",
      durationMinutes: 40,
      basePriceClp: 18000,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      categoryId: "category-1",
      status: "ACTIVE",
      isMainService: true,
      sortOrder: 1,
      depositPolicyId: "policy-1",
      category: { name: "Cortes" },
      business: { currency: "CLP" },
    },
  ]);

  const responseJson = JSON.stringify(await service.listServices(tenantContext()));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("email"), false);
  assert.equal(responseJson.includes("authSubject"), false);
  assert.equal(responseJson.includes("requestId"), false);
  assert.equal(responseJson.includes("depositPolicyId"), false);
});

