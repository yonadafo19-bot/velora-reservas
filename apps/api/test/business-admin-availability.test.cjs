const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessAdminAvailabilityService,
} = require("../dist/businesses/business-admin-availability.service.js");

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

function serviceWithMocks(options = {}) {
  const calls = {
    businessHourCreate: [],
    professionalAvailabilityRuleCreate: [],
  };
  const rows = {
    locations: Object.prototype.hasOwnProperty.call(options, "locations")
      ? options.locations
      : [{ id: "location-1" }],
    professional: Object.prototype.hasOwnProperty.call(options, "professional")
      ? options.professional
      : { id: "professional-1" },
    businessHours: options.businessHours ?? [
      {
        id: "hour-1",
        locationId: "location-1",
        weekday: "MONDAY",
        opensAtLocal: "10:00",
        closesAtLocal: "19:00",
        status: "ACTIVE",
      },
    ],
    rules: options.rules ?? [
      {
        id: "rule-1",
        locationId: "location-1",
        weekday: "MONDAY",
        startsAtLocal: "10:00",
        endsAtLocal: "18:00",
        status: "ACTIVE",
      },
    ],
  };
  const transaction = {
    location: {
      findMany: async (query) => {
        calls.locationFindMany = query;
        return rows.locations;
      },
    },
    professional: {
      findFirst: async (query) => {
        calls.professionalFindFirst = query;
        return rows.professional;
      },
    },
    businessHour: {
      updateMany: async (query) => {
        calls.businessHourUpdateMany = query;
        return { count: 1 };
      },
      create: async (query) => {
        calls.businessHourCreate.push(query);
        return { id: "hour-new" };
      },
      findMany: async (query) => {
        calls.businessHourFindMany = query;
        return rows.businessHours;
      },
    },
    professionalAvailabilityRule: {
      updateMany: async (query) => {
        calls.professionalAvailabilityRuleUpdateMany = query;
        return { count: 1 };
      },
      create: async (query) => {
        calls.professionalAvailabilityRuleCreate.push(query);
        return { id: "rule-new" };
      },
      findMany: async (query) => {
        calls.professionalAvailabilityRuleFindMany = query;
        return rows.rules;
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
    service: new BusinessAdminAvailabilityService(transactions),
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

test("business admin availability reemplaza horario de negocio valido", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.replaceBusinessHours(
    tenantContext(),
    "velora-barberia-demo",
    {
      hours: [
        {
          locationId: "location-1",
          weekday: "MONDAY",
          opensAtLocal: "10:00",
          closesAtLocal: "19:00",
        },
      ],
    },
  );

  assert.equal(calls.transactionStarted, true);
  assert.deepEqual(calls.locationFindMany.where, {
    businessId: "business-tenant-1",
    id: {
      in: ["location-1"],
    },
    status: "ACTIVE",
  });
  assert.deepEqual(calls.businessHourUpdateMany, {
    where: {
      businessId: "business-tenant-1",
      status: "ACTIVE",
    },
    data: {
      status: "INACTIVE",
    },
  });
  assert.deepEqual(calls.businessHourCreate[0].data, {
    businessId: "business-tenant-1",
    locationId: "location-1",
    weekday: "MONDAY",
    opensAtLocal: "10:00",
    closesAtLocal: "19:00",
    status: "ACTIVE",
  });
  assert.deepEqual(response.hours, [
    {
      id: "hour-1",
      locationId: "location-1",
      weekday: "MONDAY",
      opensAtLocal: "10:00",
      closesAtLocal: "19:00",
      status: "ACTIVE",
    },
  ]);
});

test("business admin availability rechaza weekday invalido", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.replaceBusinessHours(tenantContext(), "velora-barberia-demo", {
      hours: [
        {
          weekday: "LUNES",
          opensAtLocal: "10:00",
          closesAtLocal: "19:00",
        },
      ],
    }),
    400,
    "ADMIN_AVAILABILITY_INVALID_INPUT",
  );
});

test("business admin availability rechaza start mayor o igual a end", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.replaceBusinessHours(tenantContext(), "velora-barberia-demo", {
      hours: [
        {
          weekday: "MONDAY",
          opensAtLocal: "19:00",
          closesAtLocal: "10:00",
        },
      ],
    }),
    400,
    "ADMIN_AVAILABILITY_INVALID_INPUT",
  );
});

test("business admin availability rechaza locationId de otro negocio", async () => {
  const { service } = serviceWithMocks({ locations: [] });

  await rejectsWithCode(
    () => service.replaceBusinessHours(tenantContext(), "velora-barberia-demo", {
      hours: [
        {
          locationId: "location-other-tenant",
          weekday: "MONDAY",
          opensAtLocal: "10:00",
          closesAtLocal: "19:00",
        },
      ],
    }),
    400,
    "ADMIN_LOCATION_INVALID",
  );
});

test("business admin availability guarda disponibilidad profesional valida", async () => {
  const { service, calls } = serviceWithMocks();

  const response = await service.replaceProfessionalAvailability(
    tenantContext(),
    "velora-barberia-demo",
    "professional-1",
    {
      rules: [
        {
          locationId: "location-1",
          weekday: "MONDAY",
          startsAtLocal: "10:00",
          endsAtLocal: "18:00",
        },
      ],
    },
  );

  assert.deepEqual(calls.professionalFindFirst.where, {
    id: "professional-1",
    businessId: "business-tenant-1",
  });
  assert.deepEqual(calls.professionalAvailabilityRuleUpdateMany, {
    where: {
      businessId: "business-tenant-1",
      professionalId: "professional-1",
      status: "ACTIVE",
    },
    data: {
      status: "INACTIVE",
    },
  });
  assert.deepEqual(calls.professionalAvailabilityRuleCreate[0].data, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    locationId: "location-1",
    weekday: "MONDAY",
    startsAtLocal: "10:00",
    endsAtLocal: "18:00",
    status: "ACTIVE",
  });
  assert.deepEqual(response, {
    professionalId: "professional-1",
    rules: [
      {
        id: "rule-1",
        locationId: "location-1",
        weekday: "MONDAY",
        startsAtLocal: "10:00",
        endsAtLocal: "18:00",
        status: "ACTIVE",
      },
    ],
  });
});

test("business admin availability rechaza professionalId de otro negocio", async () => {
  const { service } = serviceWithMocks({ professional: null });

  await rejectsWithCode(
    () => service.replaceProfessionalAvailability(
      tenantContext(),
      "velora-barberia-demo",
      "professional-other-tenant",
      {
        rules: [
          {
            locationId: "location-1",
            weekday: "MONDAY",
            startsAtLocal: "10:00",
            endsAtLocal: "18:00",
          },
        ],
      },
    ),
    404,
    "ADMIN_PROFESSIONAL_NOT_FOUND",
  );
});

test("business admin availability rechaza businessSlug distinto del tenant", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.replaceBusinessHours(tenantContext(), "otro-negocio", {
      hours: [
        {
          weekday: "MONDAY",
          opensAtLocal: "10:00",
          closesAtLocal: "19:00",
        },
      ],
    }),
    403,
    "TENANT_BUSINESS_MISMATCH",
  );
});

test("business admin availability no expone campos internos sensibles", async () => {
  const { service } = serviceWithMocks({
    businessHours: [
      {
        id: "hour-1",
        businessId: "business-tenant-1",
        locationId: null,
        weekday: "MONDAY",
        opensAtLocal: "10:00",
        closesAtLocal: "19:00",
        status: "ACTIVE",
      },
    ],
  });

  const responseJson = JSON.stringify(await service.replaceBusinessHours(
    tenantContext(),
    "velora-barberia-demo",
    {
      hours: [
        {
          weekday: "MONDAY",
          opensAtLocal: "10:00",
          closesAtLocal: "19:00",
        },
      ],
    },
  ));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("authSubject"), false);
  assert.equal(responseJson.includes("requestId"), false);
});
