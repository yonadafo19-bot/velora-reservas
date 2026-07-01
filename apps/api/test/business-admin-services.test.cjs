const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessAdminServicesService,
} = require("../dist/businesses/business-admin-services.service.js");

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

function serviceRow(overrides = {}) {
  return {
    id: "service-1",
    slug: "corte-clasico",
    name: "Corte clasico",
    description: "Corte personalizado.",
    durationMinutes: 40,
    basePriceClp: 18000,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    categoryId: null,
    status: "ACTIVE",
    isMainService: true,
    sortOrder: 0,
    category: null,
    business: { currency: "CLP" },
    ...overrides,
  };
}

function serviceWithMocks(options = {}) {
  const calls = {
    serviceFindFirst: [],
    serviceUpdateMany: [],
  };
  const rows = {
    existingService: Object.prototype.hasOwnProperty.call(options, "existingService")
      ? options.existingService
      : { id: "service-1", slug: "corte-clasico" },
    duplicatedSlug: options.duplicatedSlug ?? null,
    category: Object.prototype.hasOwnProperty.call(options, "category")
      ? options.category
      : { id: "category-1" },
    response: options.response ?? serviceRow(),
  };
  const transaction = {
    serviceCategory: {
      findFirst: async (query) => {
        calls.categoryFindFirst = query;
        return rows.category;
      },
    },
    service: {
      findFirst: async (query) => {
        calls.serviceFindFirst.push(query);
        if (query.where?.slug) {
          return rows.duplicatedSlug;
        }
        if (query.select?.business) {
          return rows.response;
        }
        if (query.select?.slug) {
          return rows.existingService;
        }
        return rows.response;
      },
      create: async (query) => {
        calls.serviceCreate = query;
        return { id: "service-1" };
      },
      updateMany: async (query) => {
        calls.serviceUpdateMany.push(query);
        return { count: options.updateCount ?? 1 };
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
    service: new BusinessAdminServicesService(transactions),
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

test("business admin services crea servicio valido tenant-safe", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.createService(
    tenantContext(),
    "velora-barberia-demo",
    {
      name: " Corte clasico ",
      description: " Corte personalizado. ",
      basePriceClp: 18000,
      durationMinutes: 40,
      bufferAfterMinutes: 5,
      status: "ACTIVE",
    },
  );

  assert.equal(calls.transactionStarted, true);
  assert.deepEqual(calls.serviceCreate.data, {
    businessId: "business-tenant-1",
    categoryId: null,
    name: "Corte clasico",
    slug: "corte-clasico",
    description: "Corte personalizado.",
    basePriceClp: 18000,
    durationMinutes: 40,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    status: "ACTIVE",
    isMainService: true,
    sortOrder: 0,
  });
  assert.deepEqual(response, {
    id: "service-1",
    slug: "corte-clasico",
    name: "Corte clasico",
    description: "Corte personalizado.",
    durationMinutes: 40,
    priceFrom: 18000,
    priceTo: 18000,
    currency: "CLP",
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    categoryId: null,
    categoryName: null,
    status: "ACTIVE",
    isActive: true,
    isMainService: true,
    sortOrder: 0,
  });
});

test("business admin services rechaza precio negativo", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createService(tenantContext(), "velora-barberia-demo", {
      name: "Corte",
      basePriceClp: -1,
      durationMinutes: 30,
    }),
    400,
    "ADMIN_SERVICE_INVALID_INPUT",
  );
});

test("business admin services rechaza duracion invalida", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createService(tenantContext(), "velora-barberia-demo", {
      name: "Corte",
      basePriceClp: 1000,
      durationMinutes: 0,
    }),
    400,
    "ADMIN_SERVICE_INVALID_INPUT",
  );
});

test("business admin services actualiza servicio del mismo tenant", async () => {
  const { service, calls } = serviceWithMocks({
    response: serviceRow({ status: "INACTIVE" }),
  });

  const response = await service.updateService(
    tenantContext(),
    "velora-barberia-demo",
    "service-1",
    { status: "INACTIVE", basePriceClp: 19000 },
  );

  assert.deepEqual(calls.serviceFindFirst[0].where, {
    id: "service-1",
    businessId: "business-tenant-1",
  });
  assert.deepEqual(calls.serviceUpdateMany[0], {
    where: {
      id: "service-1",
      businessId: "business-tenant-1",
    },
    data: {
      basePriceClp: 19000,
      status: "INACTIVE",
    },
  });
  assert.equal(response.status, "INACTIVE");
});

test("business admin services rechaza update cross-tenant", async () => {
  const { service } = serviceWithMocks({ existingService: null });

  await rejectsWithCode(
    () => service.updateService(
      tenantContext(),
      "velora-barberia-demo",
      "service-other-tenant",
      { name: "Corte nuevo" },
    ),
    404,
    "ADMIN_SERVICE_NOT_FOUND",
  );
});

test("business admin services rechaza slug duplicado", async () => {
  const { service } = serviceWithMocks({ duplicatedSlug: { id: "service-2" } });

  await rejectsWithCode(
    () => service.createService(tenantContext(), "velora-barberia-demo", {
      name: "Corte clasico",
      slug: "corte-clasico",
      basePriceClp: 18000,
      durationMinutes: 40,
    }),
    400,
    "ADMIN_SERVICE_SLUG_DUPLICATED",
  );
});

test("business admin services rechaza businessSlug distinto del tenant", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createService(tenantContext(), "otro-negocio", {
      name: "Corte",
      basePriceClp: 1000,
      durationMinutes: 30,
    }),
    403,
    "TENANT_BUSINESS_MISMATCH",
  );
});

test("business admin services no expone campos internos sensibles", async () => {
  const { service } = serviceWithMocks({
    response: {
      ...serviceRow(),
      businessId: "business-tenant-1",
      depositPolicyId: "policy-1",
    },
  });

  const responseJson = JSON.stringify(await service.createService(
    tenantContext(),
    "velora-barberia-demo",
    {
      name: "Corte",
      basePriceClp: 1000,
      durationMinutes: 30,
    },
  ));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("depositPolicyId"), false);
  assert.equal(responseJson.includes("authSubject"), false);
});
