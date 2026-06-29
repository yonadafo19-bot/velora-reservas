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
    ...overrides,
  };
}

function serviceWithMocks(options = {}) {
  const calls = {
    professionalFindFirst: [],
    professionalUpdateMany: [],
    professionalServiceUpdateMany: [],
    professionalServiceCreate: [],
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
