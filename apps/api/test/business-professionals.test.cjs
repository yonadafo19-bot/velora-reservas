const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessProfessionalsService,
} = require("../dist/businesses/business-professionals.service.js");

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
      professional: {
        findMany: async (receivedQuery) => {
          query = receivedQuery;
          return rows;
        },
      },
    }),
  };

  return {
    service: new BusinessProfessionalsService(database),
    getQuery: () => query,
  };
}

test("business professionals consulta Prisma usando businessId desde TenantContext", async () => {
  const { service, getQuery } = serviceWithMockedDatabase([]);

  await service.listProfessionals(tenantContext());

  assert.deepEqual(getQuery().where, {
    businessId: "business-tenant-1",
  });
});

test("business professionals usa orden estable", async () => {
  const { service, getQuery } = serviceWithMockedDatabase([]);

  await service.listProfessionals(tenantContext());

  assert.deepEqual(getQuery().orderBy, [
    { sortOrder: "asc" },
    { displayName: "asc" },
    { id: "asc" },
  ]);
  assert.deepEqual(getQuery().select.services.orderBy, [
    { service: { sortOrder: "asc" } },
    { service: { name: "asc" } },
    { service: { id: "asc" } },
  ]);
  assert.deepEqual(getQuery().select.locations.orderBy, [
    { locationId: "asc" },
    { id: "asc" },
  ]);
});

test("business professionals selecciona solo campos necesarios", async () => {
  const { service, getQuery } = serviceWithMockedDatabase([]);

  await service.listProfessionals(tenantContext());

  assert.deepEqual(getQuery().select, {
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
  });
});

test("business professionals mapea campos y servicios asociados", async () => {
  const { service } = serviceWithMockedDatabase([
    {
      id: "professional-1",
      displayName: "Matias Rojas",
      roleTitle: "Barbero senior",
      bio: "Perfil demo.",
      status: "ACTIVE",
      services: [
        {
          service: {
            id: "service-1",
            name: "Corte clasico",
          },
        },
        {
          service: {
            id: "service-2",
            name: "Perfilado de barba",
          },
        },
      ],
      locations: [
        {
          location: {
            id: "location-1",
            slug: "providencia-demo",
            name: "Sucursal Providencia Demo",
            addressLine: "Av. Providencia 123",
            city: "Santiago",
            status: "ACTIVE",
          },
        },
      ],
    },
    {
      id: "professional-2",
      displayName: "Archivado Demo",
      roleTitle: null,
      bio: null,
      status: "ARCHIVED",
      services: [],
      locations: [],
    },
  ]);

  assert.deepEqual(await service.listProfessionals(tenantContext()), [
    {
      id: "professional-1",
      displayName: "Matias Rojas",
      roleTitle: "Barbero senior",
      bio: "Perfil demo.",
      status: "ACTIVE",
      isActive: true,
      services: [
        { id: "service-1", name: "Corte clasico" },
        { id: "service-2", name: "Perfilado de barba" },
      ],
      locations: [
        {
          id: "location-1",
          slug: "providencia-demo",
          name: "Sucursal Providencia Demo",
          addressLine: "Av. Providencia 123",
          city: "Santiago",
          status: "ACTIVE",
        },
      ],
    },
    {
      id: "professional-2",
      displayName: "Archivado Demo",
      roleTitle: null,
      bio: null,
      status: "ARCHIVED",
      isActive: false,
      services: [],
      locations: [],
    },
  ]);
});

test("business professionals no expone campos sensibles", async () => {
  const { service } = serviceWithMockedDatabase([
    {
      id: "professional-1",
      businessId: "business-tenant-1",
      displayName: "Matias Rojas",
      roleTitle: "Barbero senior",
      bio: "Perfil demo.",
      phone: "+56 9 0000 0000",
      email: "professional@example.invalid",
      status: "ACTIVE",
      services: [
        {
          service: {
            id: "service-1",
            businessId: "business-tenant-1",
            name: "Corte clasico",
          },
        },
      ],
      locations: [
        {
          location: {
            id: "location-1",
            businessId: "business-tenant-1",
            slug: "providencia-demo",
            name: "Sucursal Providencia Demo",
            addressLine: "Av. Providencia 123",
            city: "Santiago",
            status: "ACTIVE",
          },
        },
      ],
    },
  ]);

  const responseJson = JSON.stringify(await service.listProfessionals(tenantContext()));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("email"), false);
  assert.equal(responseJson.includes("authSubject"), false);
  assert.equal(responseJson.includes("requestId"), false);
  assert.equal(responseJson.includes("phone"), false);
  assert.equal(responseJson.includes("professional@example.invalid"), false);
});
