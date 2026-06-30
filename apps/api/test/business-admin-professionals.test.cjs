const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessAdminProfessionalsService,
} = require("../dist/businesses/business-admin-professionals.service.js");

function tenantContext(overrides = {}) {
  return {
    businessId: "business-tenant-1",
    businessSlug: "velora-barberia-demo",
    businessName: "Velora Barberia Demo",
    businessVertical: "BARBERSHOP",
    membershipId: "membership-1",
    role: "OWNER",
    userId: "user-1",
    ...overrides,
  };
}

function professionalRow(overrides = {}) {
  return {
    id: "professional-1",
    slug: "matias-rojas",
    displayName: "Matias Rojas",
    roleTitle: "Barbero senior",
    bio: "Especialista en cortes.",
    status: "ACTIVE",
    sortOrder: 0,
    services: [
      {
        service: {
          id: "service-1",
          name: "Corte clasico",
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
    ...overrides,
  };
}

function serviceWithMocks(options = {}) {
  const calls = {
    professionalFindFirst: [],
    professionalUpdateMany: [],
    professionalServiceUpdateMany: [],
    professionalServiceCreate: [],
    professionalServiceUpsert: [],
    professionalLocationUpdateMany: [],
    professionalLocationCreate: [],
    professionalLocationUpsert: [],
  };
  const rows = {
    existingProfessional: Object.prototype.hasOwnProperty.call(options, "existingProfessional")
      ? options.existingProfessional
      : { id: "professional-1", slug: "matias-rojas" },
    duplicatedSlug: options.duplicatedSlug ?? null,
    services: Object.prototype.hasOwnProperty.call(options, "services")
      ? options.services
      : [{ id: "service-1" }],
    professionalServiceExisting: options.professionalServiceExisting ?? null,
    professionalLocationExisting: options.professionalLocationExisting ?? null,
    locations: Object.prototype.hasOwnProperty.call(options, "locations")
      ? options.locations
      : [{ id: "location-1" }],
    locationRows: Object.prototype.hasOwnProperty.call(options, "locationRows")
      ? options.locationRows
      : [
        {
          id: "location-1",
          slug: "providencia-demo",
          name: "Sucursal Providencia Demo",
          addressLine: "Av. Providencia 123",
          city: "Santiago",
          status: "ACTIVE",
        },
      ],
    response: options.response ?? professionalRow(),
  };
  const transaction = {
    professional: {
      findFirst: async (query) => {
        calls.professionalFindFirst.push(query);
        if (query.where?.slug) {
          return rows.duplicatedSlug;
        }
        if (query.select?.services) {
          return rows.response;
        }
        if (query.select?.slug) {
          return rows.existingProfessional;
        }
        return rows.response;
      },
      create: async (query) => {
        if (options.professionalCreateError) {
          throw options.professionalCreateError;
        }
        calls.professionalCreate = query;
        return { id: "professional-1" };
      },
      updateMany: async (query) => {
        calls.professionalUpdateMany.push(query);
        return { count: options.updateCount ?? 1 };
      },
    },
    service: {
      findMany: async (query) => {
        calls.serviceFindMany = query;
        return rows.services;
      },
    },
    location: {
      findMany: async (query) => {
        calls.locationFindMany = query;
        if (query.select?.slug) {
          return rows.locationRows;
        }
        return rows.locations;
      },
    },
    professionalService: {
      updateMany: async (query) => {
        calls.professionalServiceUpdateMany.push(query);
        return { count: 1 };
      },
      findFirst: async (query) => {
        calls.professionalServiceFindFirst = query;
        return rows.professionalServiceExisting;
      },
      create: async (query) => {
        calls.professionalServiceCreate.push(query);
        return { id: "professional-service-1" };
      },
      upsert: async (query) => {
        if (options.professionalServiceUpsertError) {
          throw options.professionalServiceUpsertError;
        }
        calls.professionalServiceUpsert.push(query);
        return { id: "professional-service-1" };
      },
    },
    professionalLocation: {
      updateMany: async (query) => {
        calls.professionalLocationUpdateMany.push(query);
        return { count: 1 };
      },
      findFirst: async (query) => {
        calls.professionalLocationFindFirst = query;
        return rows.professionalLocationExisting;
      },
      create: async (query) => {
        calls.professionalLocationCreate.push(query);
        return { id: "professional-location-1" };
      },
      upsert: async (query) => {
        if (options.professionalLocationUpsertError) {
          throw options.professionalLocationUpsertError;
        }
        calls.professionalLocationUpsert.push(query);
        return { id: "professional-location-1" };
      },
    },
  };
  const transactions = {
    runInTransaction: async (callback) => {
      calls.transactionStarted = true;
      return callback(transaction);
    },
  };

  return {
    service: new BusinessAdminProfessionalsService(transactions),
    calls,
  };
}

function rejectsWithCode(action, status, code) {
  return assert.rejects(
    action,
    (error) => error.getStatus() === status
      && error.getResponse().code === code,
  );
}

test("business admin professionals crea profesional valido tenant-safe", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.createProfessional(
    tenantContext(),
    "velora-barberia-demo",
    {
      displayName: " Matias Rojas ",
      roleTitle: " Barbero senior ",
      phone: "+56 9 0000 0000",
      email: "matias@example.invalid",
      status: "ACTIVE",
    },
  );

  assert.equal(calls.transactionStarted, true);
  assert.deepEqual(calls.professionalCreate.data, {
    businessId: "business-tenant-1",
    displayName: "Matias Rojas",
    slug: "matias-rojas",
    roleTitle: "Barbero senior",
    bio: null,
    phone: "+56 9 0000 0000",
    email: "matias@example.invalid",
    status: "ACTIVE",
    sortOrder: 0,
  });
  assert.equal(response.displayName, "Matias Rojas");
  assert.deepEqual(response.services, [{ id: "service-1", name: "Corte clasico" }]);
  assert.deepEqual(response.locations, [
    {
      id: "location-1",
      slug: "providencia-demo",
      name: "Sucursal Providencia Demo",
      addressLine: "Av. Providencia 123",
      city: "Santiago",
      status: "ACTIVE",
    },
  ]);
});

test("business admin professionals crea profesional compuesto con servicios y ubicaciones barberia", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.createProfessional(
    tenantContext(),
    "velora-barberia-demo",
    {
      displayName: " Matias Rojas ",
      roleTitle: " Barbero senior ",
      status: "ACTIVE",
      serviceIds: ["service-1"],
      locationIds: ["location-1"],
    },
  );

  assert.equal(calls.transactionStarted, true);
  assert.deepEqual(calls.serviceFindMany.where, {
    businessId: "business-tenant-1",
    id: {
      in: ["service-1"],
    },
    status: "ACTIVE",
  });
  assert.deepEqual(calls.locationFindMany.where, {
    businessId: "business-tenant-1",
    id: {
      in: ["location-1"],
    },
    status: "ACTIVE",
  });
  assert.deepEqual(calls.professionalServiceUpsert[0], {
    where: {
      businessId_professionalId_serviceId: {
        businessId: "business-tenant-1",
        professionalId: "professional-1",
        serviceId: "service-1",
      },
    },
    update: { status: "ACTIVE" },
    create: {
      businessId: "business-tenant-1",
      professionalId: "professional-1",
      serviceId: "service-1",
      status: "ACTIVE",
    },
  });
  assert.deepEqual(calls.professionalLocationUpsert[0], {
    where: {
      businessId_professionalId_locationId: {
        businessId: "business-tenant-1",
        professionalId: "professional-1",
        locationId: "location-1",
      },
    },
    update: { status: "ACTIVE" },
    create: {
      businessId: "business-tenant-1",
      professionalId: "professional-1",
      locationId: "location-1",
      status: "ACTIVE",
    },
  });
  assert.equal(response.services.length, 1);
  assert.equal(response.locations.length, 1);
});

test("business admin professionals crea profesional compuesto para belleza tenant-safe", async () => {
  const { service, calls } = serviceWithMocks({
    services: [{ id: "beauty-service-1" }],
    locations: [{ id: "beauty-location-1" }],
    response: professionalRow({
      id: "beauty-professional-1",
      slug: "sofia-araya",
      displayName: "Sofia Araya",
      roleTitle: "Nail artist",
      services: [
        {
          service: {
            id: "beauty-service-1",
            name: "Manicure spa",
          },
        },
      ],
      locations: [
        {
          location: {
            id: "beauty-location-1",
            slug: "las-condes-demo",
            name: "Sucursal Las Condes Demo",
            addressLine: "Av. Apoquindo 1000",
            city: "Santiago",
            status: "ACTIVE",
          },
        },
      ],
    }),
  });

  const response = await service.createProfessional(
    tenantContext({
      businessId: "seed-beauty-business-main",
      businessSlug: "velora-beauty-studio-demo",
      businessName: "Velora Beauty Studio Demo",
      businessVertical: "BEAUTY_STUDIO",
    }),
    "velora-beauty-studio-demo",
    {
      displayName: " Sofia Araya ",
      roleTitle: " Nail artist ",
      status: "ACTIVE",
      serviceIds: ["beauty-service-1"],
      locationIds: ["beauty-location-1"],
    },
  );

  assert.equal(calls.professionalCreate.data.businessId, "seed-beauty-business-main");
  assert.deepEqual(calls.professionalServiceUpsert[0].create, {
    businessId: "seed-beauty-business-main",
    professionalId: "professional-1",
    serviceId: "beauty-service-1",
    status: "ACTIVE",
  });
  assert.deepEqual(calls.professionalLocationUpsert[0].create, {
    businessId: "seed-beauty-business-main",
    professionalId: "professional-1",
    locationId: "beauty-location-1",
    status: "ACTIVE",
  });
  assert.deepEqual(response.services, [{ id: "beauty-service-1", name: "Manicure spa" }]);
  assert.equal(response.locations[0].id, "beauty-location-1");
});

test("business admin professionals lista ubicaciones activas tenant-safe", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.listLocations(tenantContext(), "velora-barberia-demo");

  assert.deepEqual(calls.locationFindMany.where, {
    businessId: "business-tenant-1",
    status: "ACTIVE",
  });
  assert.deepEqual(response, [
    {
      id: "location-1",
      slug: "providencia-demo",
      name: "Sucursal Providencia Demo",
      addressLine: "Av. Providencia 123",
      city: "Santiago",
      status: "ACTIVE",
    },
  ]);
});

test("business admin professionals actualiza profesional del mismo tenant", async () => {
  const { service, calls } = serviceWithMocks({
    response: professionalRow({ roleTitle: "Colorista" }),
  });

  const response = await service.updateProfessional(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    { roleTitle: "Colorista" },
  );

  assert.deepEqual(calls.professionalFindFirst[0].where, {
    id: "professional-1",
    businessId: "business-tenant-1",
  });
  assert.deepEqual(calls.professionalUpdateMany[0], {
    where: {
      id: "professional-1",
      businessId: "business-tenant-1",
    },
    data: {
      roleTitle: "Colorista",
    },
  });
  assert.equal(response.roleTitle, "Colorista");
});

test("business admin professionals actualiza profesional compuesto en una transaccion", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.updateProfessional(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    {
      displayName: "Matias Rojas",
      roleTitle: "Colorista",
      status: "ACTIVE",
      serviceIds: ["service-1"],
      locationIds: ["location-1"],
    },
  );

  assert.deepEqual(calls.professionalUpdateMany[0].data, {
    displayName: "Matias Rojas",
    roleTitle: "Colorista",
    status: "ACTIVE",
  });
  assert.deepEqual(calls.professionalServiceUpsert[0].create, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    serviceId: "service-1",
    status: "ACTIVE",
  });
  assert.deepEqual(calls.professionalLocationUpsert[0].create, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    locationId: "location-1",
    status: "ACTIVE",
  });
  assert.equal(response.id, "professional-1");
});

test("business admin professionals repara profesional parcial existente en belleza", async () => {
  const { service, calls } = serviceWithMocks({
    existingProfessional: { id: "beauty-partial-1", slug: "lorens-pro" },
    services: [{ id: "seed-beauty-service-manicure-permanente" }],
    locations: [{ id: "seed-beauty-location-main" }],
    response: professionalRow({
      id: "beauty-partial-1",
      slug: "lorens-pro",
      displayName: "Lorens Pro",
      roleTitle: "La Mas Pro",
      bio: "La Mas Pro de Todas",
      services: [
        {
          service: {
            id: "seed-beauty-service-manicure-permanente",
            name: "Manicure permanente",
          },
        },
      ],
      locations: [
        {
          location: {
            id: "seed-beauty-location-main",
            slug: "nunoa-demo",
            name: "Sucursal Nunoa Demo",
            addressLine: "Calle Demostracion 245, Nunoa",
            city: "Santiago",
            status: "ACTIVE",
          },
        },
      ],
    }),
  });

  const response = await service.updateProfessional(
    tenantContext({
      businessId: "seed-beauty-business-main",
      businessSlug: "velora-beauty-studio-demo",
      businessName: "Velora Beauty Studio Demo",
      businessVertical: "BEAUTY_STUDIO",
    }),
    "velora-beauty-studio-demo",
    "beauty-partial-1",
    {
      displayName: "Lorens Pro",
      roleTitle: "La Mas Pro",
      bio: "La Mas Pro de Todas",
      status: "ACTIVE",
      serviceIds: ["seed-beauty-service-manicure-permanente"],
      locationIds: ["seed-beauty-location-main"],
    },
  );

  assert.deepEqual(calls.professionalUpdateMany[0].where, {
    id: "beauty-partial-1",
    businessId: "seed-beauty-business-main",
  });
  assert.deepEqual(calls.professionalServiceUpsert[0].where, {
    businessId_professionalId_serviceId: {
      businessId: "seed-beauty-business-main",
      professionalId: "beauty-partial-1",
      serviceId: "seed-beauty-service-manicure-permanente",
    },
  });
  assert.deepEqual(calls.professionalLocationUpsert[0].where, {
    businessId_professionalId_locationId: {
      businessId: "seed-beauty-business-main",
      professionalId: "beauty-partial-1",
      locationId: "seed-beauty-location-main",
    },
  });
  assert.equal(response.services.length, 1);
  assert.equal(response.locations.length, 1);
});

test("business admin professionals permite update compuesto solo de asignaciones", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.updateProfessional(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    {
      serviceIds: ["service-1"],
      locationIds: ["location-1"],
    },
  );

  assert.deepEqual(calls.professionalUpdateMany, []);
  assert.deepEqual(calls.professionalServiceUpsert[0].create, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    serviceId: "service-1",
    status: "ACTIVE",
  });
  assert.deepEqual(calls.professionalLocationUpsert[0].create, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    locationId: "location-1",
    status: "ACTIVE",
  });
  assert.equal(response.id, "professional-1");
});

test("business admin professionals rechaza update cross-tenant", async () => {
  const { service } = serviceWithMocks({ existingProfessional: null });

  await rejectsWithCode(
    () => service.updateProfessional(
      tenantContext(),
      "velora-barberia-demo",
      "professional-other-tenant",
      { roleTitle: "Senior" },
    ),
    404,
    "ADMIN_PROFESSIONAL_NOT_FOUND",
  );
});

test("business admin professionals rechaza payload invalido", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createProfessional(tenantContext(), "velora-barberia-demo", {
      displayName: " ",
    }),
    400,
    "ADMIN_PROFESSIONAL_INVALID_INPUT",
  );
});

test("business admin professionals rechaza slug duplicado", async () => {
  const { service } = serviceWithMocks({ duplicatedSlug: { id: "professional-2" } });

  await rejectsWithCode(
    () => service.createProfessional(tenantContext(), "velora-barberia-demo", {
      displayName: "Matias Rojas",
      slug: "matias-rojas",
    }),
    400,
    "ADMIN_PROFESSIONAL_SLUG_DUPLICATED",
  );
});

test("business admin professionals mapea unique Prisma de slug a error controlado", async () => {
  const { service } = serviceWithMocks({
    professionalCreateError: {
      code: "P2002",
      meta: { target: ["businessId", "slug"] },
    },
  });

  await rejectsWithCode(
    () => service.createProfessional(tenantContext(), "velora-barberia-demo", {
      displayName: "Matias Rojas",
    }),
    400,
    "ADMIN_PROFESSIONAL_SLUG_DUPLICATED",
  );
});

test("business admin professionals mapea error Prisma de relacion a error controlado", async () => {
  const { service } = serviceWithMocks({
    professionalServiceUpsertError: {
      code: "P2003",
      meta: { field_name: "ProfessionalService_service_fkey" },
    },
  });

  await rejectsWithCode(
    () => service.updateProfessional(
      tenantContext(),
      "velora-barberia-demo",
      "professional-1",
      { serviceIds: ["service-1"] },
    ),
    400,
    "ADMIN_PROFESSIONAL_RELATION_INVALID",
  );
});

test("business admin professionals rechaza create compuesto con servicio invalido sin crear parcial", async () => {
  const { service, calls } = serviceWithMocks({ services: [] });

  await rejectsWithCode(
    () => service.createProfessional(tenantContext(), "velora-barberia-demo", {
      displayName: "Matias Rojas",
      serviceIds: ["service-other-tenant"],
      locationIds: ["location-1"],
    }),
    400,
    "ADMIN_PROFESSIONAL_SERVICE_INVALID",
  );

  assert.equal(calls.professionalCreate, undefined);
  assert.deepEqual(calls.professionalServiceCreate, []);
  assert.deepEqual(calls.professionalLocationCreate, []);
  assert.deepEqual(calls.professionalServiceUpsert, []);
  assert.deepEqual(calls.professionalLocationUpsert, []);
});

test("business admin professionals rechaza create compuesto con ubicacion invalida sin crear parcial", async () => {
  const { service, calls } = serviceWithMocks({ locations: [] });

  await rejectsWithCode(
    () => service.createProfessional(tenantContext(), "velora-barberia-demo", {
      displayName: "Matias Rojas",
      serviceIds: ["service-1"],
      locationIds: ["location-other-tenant"],
    }),
    400,
    "ADMIN_PROFESSIONAL_LOCATION_INVALID",
  );

  assert.equal(calls.professionalCreate, undefined);
  assert.deepEqual(calls.professionalServiceCreate, []);
  assert.deepEqual(calls.professionalLocationCreate, []);
  assert.deepEqual(calls.professionalServiceUpsert, []);
  assert.deepEqual(calls.professionalLocationUpsert, []);
});

test("business admin professionals asocia servicios validos", async () => {
  const { service, calls } = serviceWithMocks({
    professionalServiceExisting: { id: "professional-service-existing" },
  });

  const response = await service.replaceProfessionalServices(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    { serviceIds: ["service-1"] },
  );

  assert.deepEqual(calls.serviceFindMany.where, {
    businessId: "business-tenant-1",
    id: {
      in: ["service-1"],
    },
    status: "ACTIVE",
  });
  assert.deepEqual(calls.professionalServiceUpdateMany[0].where, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    status: "ACTIVE",
    serviceId: {
      notIn: ["service-1"],
    },
  });
  assert.deepEqual(calls.professionalServiceUpsert[0], {
    where: {
      businessId_professionalId_serviceId: {
        businessId: "business-tenant-1",
        professionalId: "professional-1",
        serviceId: "service-1",
      },
    },
    update: { status: "ACTIVE" },
    create: {
      businessId: "business-tenant-1",
      professionalId: "professional-1",
      serviceId: "service-1",
      status: "ACTIVE",
    },
  });
  assert.equal(response.id, "professional-1");
});

test("business admin professionals reactivacion de servicio existente usa upsert idempotente", async () => {
  const { service, calls } = serviceWithMocks();

  await service.replaceProfessionalServices(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    { serviceIds: ["service-1"] },
  );

  assert.equal(calls.professionalServiceUpsert.length, 1);
  assert.deepEqual(calls.professionalServiceUpsert[0].update, { status: "ACTIVE" });
  assert.deepEqual(calls.professionalServiceCreate, []);
});

test("business admin professionals rechaza servicio de otro negocio", async () => {
  const { service } = serviceWithMocks({ services: [] });

  await rejectsWithCode(
    () => service.replaceProfessionalServices(
      tenantContext(),
      "velora-barberia-demo",
      "professional-1",
      { serviceIds: ["service-other-tenant"] },
    ),
    400,
    "ADMIN_PROFESSIONAL_SERVICE_INVALID",
  );
});

test("business admin professionals rechaza profesional de otro negocio", async () => {
  const { service } = serviceWithMocks({ existingProfessional: null });

  await rejectsWithCode(
    () => service.replaceProfessionalServices(
      tenantContext(),
      "velora-barberia-demo",
      "professional-other-tenant",
      { serviceIds: ["service-1"] },
    ),
    404,
    "ADMIN_PROFESSIONAL_NOT_FOUND",
  );
});

test("business admin professionals rechaza serviceIds duplicados", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.replaceProfessionalServices(
      tenantContext(),
      "velora-barberia-demo",
      "professional-1",
      { serviceIds: ["service-1", "service-1"] },
    ),
    400,
    "ADMIN_PROFESSIONAL_SERVICES_DUPLICATED",
  );
});

test("business admin professionals asocia ubicaciones validas", async () => {
  const { service, calls } = serviceWithMocks({
    professionalLocationExisting: { id: "professional-location-existing" },
  });

  const response = await service.replaceProfessionalLocations(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    { locationIds: ["location-1"] },
  );

  assert.deepEqual(calls.locationFindMany.where, {
    businessId: "business-tenant-1",
    id: {
      in: ["location-1"],
    },
    status: "ACTIVE",
  });
  assert.deepEqual(calls.professionalLocationUpdateMany[0].where, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    status: "ACTIVE",
    locationId: {
      notIn: ["location-1"],
    },
  });
  assert.deepEqual(calls.professionalLocationUpsert[0], {
    where: {
      businessId_professionalId_locationId: {
        businessId: "business-tenant-1",
        professionalId: "professional-1",
        locationId: "location-1",
      },
    },
    update: { status: "ACTIVE" },
    create: {
      businessId: "business-tenant-1",
      professionalId: "professional-1",
      locationId: "location-1",
      status: "ACTIVE",
    },
  });
  assert.equal(response.id, "professional-1");
});

test("business admin professionals reactivacion de ubicacion existente usa upsert idempotente", async () => {
  const { service, calls } = serviceWithMocks();

  await service.replaceProfessionalLocations(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    { locationIds: ["location-1"] },
  );

  assert.equal(calls.professionalLocationUpsert.length, 1);
  assert.deepEqual(calls.professionalLocationUpsert[0].update, { status: "ACTIVE" });
  assert.deepEqual(calls.professionalLocationCreate, []);
});

test("business admin professionals crea relacion ubicacion si no existe", async () => {
  const { service, calls } = serviceWithMocks();

  await service.replaceProfessionalLocations(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    { locationIds: ["location-1"] },
  );

  assert.deepEqual(calls.professionalLocationUpsert[0].create, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    locationId: "location-1",
    status: "ACTIVE",
  });
});

test("business admin professionals rechaza ubicacion de otro negocio o inactiva", async () => {
  const { service } = serviceWithMocks({ locations: [] });

  await rejectsWithCode(
    () => service.replaceProfessionalLocations(
      tenantContext(),
      "velora-barberia-demo",
      "professional-1",
      { locationIds: ["location-other-tenant"] },
    ),
    400,
    "ADMIN_PROFESSIONAL_LOCATION_INVALID",
  );
});

test("business admin professionals rechaza locationIds duplicados", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.replaceProfessionalLocations(
      tenantContext(),
      "velora-barberia-demo",
      "professional-1",
      { locationIds: ["location-1", "location-1"] },
    ),
    400,
    "ADMIN_PROFESSIONAL_LOCATIONS_DUPLICATED",
  );
});

test("business admin professionals rechaza ubicaciones para profesional de otro negocio", async () => {
  const { service } = serviceWithMocks({ existingProfessional: null });

  await rejectsWithCode(
    () => service.replaceProfessionalLocations(
      tenantContext(),
      "velora-barberia-demo",
      "professional-other-tenant",
      { locationIds: ["location-1"] },
    ),
    404,
    "ADMIN_PROFESSIONAL_NOT_FOUND",
  );
});

test("business admin professionals no expone email telefono ni campos internos", async () => {
  const { service } = serviceWithMocks({
    response: {
      ...professionalRow(),
      businessId: "business-tenant-1",
      phone: "+56 9 0000 0000",
      email: "matias@example.invalid",
    },
  });

  const responseJson = JSON.stringify(await service.createProfessional(
    tenantContext(),
    "velora-barberia-demo",
    { displayName: "Matias Rojas" },
  ));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("phone"), false);
  assert.equal(responseJson.includes("matias@example.invalid"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("authSubject"), false);
});
