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
    professionalLocationUpdateMany: [],
    professionalLocationCreate: [],
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
  assert.deepEqual(calls.professionalServiceUpdateMany[1], {
    where: {
      id: "professional-service-existing",
      businessId: "business-tenant-1",
    },
    data: {
      status: "ACTIVE",
    },
  });
  assert.equal(response.id, "professional-1");
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
  assert.deepEqual(calls.professionalLocationUpdateMany[1], {
    where: {
      id: "professional-location-existing",
      businessId: "business-tenant-1",
    },
    data: {
      status: "ACTIVE",
    },
  });
  assert.equal(response.id, "professional-1");
});

test("business admin professionals crea relacion ubicacion si no existe", async () => {
  const { service, calls } = serviceWithMocks();

  await service.replaceProfessionalLocations(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    { locationIds: ["location-1"] },
  );

  assert.deepEqual(calls.professionalLocationCreate[0].data, {
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
