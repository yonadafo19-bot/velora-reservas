const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessProfessionalAvailabilityService,
} = require("../dist/businesses/business-professional-availability.service.js");

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

function serviceWithMockedDatabase({ professional, locations = [], businessHours = [], weeklyRules = [], timeOff = [] }) {
  const queries = {};
  const database = {
    getClient: () => ({
      professional: {
        findFirst: async (query) => {
          queries.professional = query;
          return professional;
        },
      },
      professionalLocation: {
        findMany: async (query) => {
          queries.locations = query;
          return locations;
        },
      },
      businessHour: {
        findMany: async (query) => {
          queries.businessHours = query;
          return businessHours;
        },
      },
      professionalAvailabilityRule: {
        findMany: async (query) => {
          queries.weeklyRules = query;
          return weeklyRules;
        },
      },
      timeOff: {
        findMany: async (query) => {
          queries.timeOff = query;
          return timeOff;
        },
      },
    }),
  };

  return {
    service: new BusinessProfessionalAvailabilityService(database),
    queries,
  };
}

function activeProfessional() {
  return {
    id: "professional-1",
    businessId: "business-tenant-1",
    displayName: "Matias Rojas",
    roleTitle: "Barbero senior",
    status: "ACTIVE",
    business: {
      timezone: "America/Santiago",
    },
  };
}

test("professional availability valida profesional usando businessId desde TenantContext", async () => {
  const { service, queries } = serviceWithMockedDatabase({
    professional: activeProfessional(),
  });

  await service.getAvailability(tenantContext(), "professional-1");

  assert.deepEqual(queries.professional.where, {
    id: "professional-1",
    businessId: "business-tenant-1",
  });
});

test("professional availability lanza 404 PROFESSIONAL_NOT_FOUND si no existe", async () => {
  const { service } = serviceWithMockedDatabase({
    professional: null,
  });

  await assert.rejects(
    () => service.getAvailability(tenantContext(), "missing-professional"),
    (error) => error.getStatus() === 404
      && error.getResponse().code === "PROFESSIONAL_NOT_FOUND",
  );
});

test("professional availability consulta locations, hours, rules y timeOff con businessId tenant-safe", async () => {
  const { service, queries } = serviceWithMockedDatabase({
    professional: activeProfessional(),
    locations: [
      {
        locationId: "location-1",
        location: {
          id: "location-1",
          slug: "providencia-demo",
          name: "Sucursal Providencia Demo",
          timezone: null,
          status: "ACTIVE",
        },
      },
    ],
  });

  await service.getAvailability(tenantContext(), "professional-1");

  assert.deepEqual(queries.locations.where, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    status: "ACTIVE",
    location: {
      status: "ACTIVE",
    },
  });
  assert.equal(queries.businessHours.where.businessId, "business-tenant-1");
  assert.deepEqual(queries.businessHours.where.OR, [
    { locationId: null },
    { locationId: { in: ["location-1"] } },
  ]);
  assert.deepEqual(queries.weeklyRules.where, {
    businessId: "business-tenant-1",
    professionalId: "professional-1",
    status: "ACTIVE",
  });
  assert.equal(queries.timeOff.where.businessId, "business-tenant-1");
  assert.equal(queries.timeOff.where.status, "ACTIVE");
  assert.deepEqual(queries.timeOff.where.OR, [
    { professionalId: "professional-1" },
    { locationId: { in: ["location-1"] } },
    { professionalId: null, locationId: null },
  ]);
  assert.ok(queries.timeOff.where.endsAt.gte instanceof Date);
});

test("professional availability usa select minimo y orden estable", async () => {
  const { service, queries } = serviceWithMockedDatabase({
    professional: activeProfessional(),
  });

  await service.getAvailability(tenantContext(), "professional-1");

  assert.deepEqual(queries.professional.select, {
    id: true,
    displayName: true,
    roleTitle: true,
    status: true,
    business: {
      select: {
        timezone: true,
      },
    },
  });
  assert.deepEqual(queries.locations.select, {
    locationId: true,
    location: {
      select: {
        id: true,
        slug: true,
        name: true,
        timezone: true,
        status: true,
      },
    },
  });
  assert.deepEqual(queries.businessHours.orderBy, [
    { locationId: "asc" },
    { weekday: "asc" },
    { opensAtLocal: "asc" },
    { id: "asc" },
  ]);
  assert.deepEqual(queries.weeklyRules.orderBy, [
    { locationId: "asc" },
    { weekday: "asc" },
    { startsAtLocal: "asc" },
    { id: "asc" },
  ]);
  assert.deepEqual(queries.timeOff.orderBy, [
    { startsAt: "asc" },
    { endsAt: "asc" },
    { id: "asc" },
  ]);
});

test("professional availability mapea respuesta normalizada sin calcular slots", async () => {
  const { service } = serviceWithMockedDatabase({
    professional: activeProfessional(),
    locations: [
      {
        locationId: "location-1",
        location: {
          id: "location-1",
          slug: "providencia-demo",
          name: "Sucursal Providencia Demo",
          timezone: null,
          status: "ACTIVE",
        },
      },
      {
        locationId: "location-2",
        location: {
          id: "location-2",
          slug: "nunoa-demo",
          name: "Sucursal Nunoa Demo",
          timezone: "America/Santiago",
          status: "ACTIVE",
        },
      },
    ],
    businessHours: [
      {
        id: "hour-1",
        locationId: "location-1",
        weekday: "MONDAY",
        opensAtLocal: "10:00",
        closesAtLocal: "19:00",
        status: "ACTIVE",
      },
    ],
    weeklyRules: [
      {
        id: "rule-1",
        locationId: "location-1",
        weekday: "MONDAY",
        startsAtLocal: "10:00",
        endsAtLocal: "18:00",
        status: "ACTIVE",
      },
    ],
    timeOff: [
      {
        id: "time-off-1",
        businessId: "business-tenant-1",
        locationId: "location-1",
        startsAt: new Date("2026-07-01T14:00:00.000Z"),
        endsAt: new Date("2026-07-01T16:00:00.000Z"),
        reason: "Motivo interno",
        status: "ACTIVE",
      },
    ],
  });

  const response = await service.getAvailability(tenantContext(), "professional-1");

  assert.deepEqual(response, {
    professional: {
      id: "professional-1",
      displayName: "Matias Rojas",
      roleTitle: "Barbero senior",
      status: "ACTIVE",
      isActive: true,
    },
    timezone: {
      business: "America/Santiago",
    },
    locations: [
      {
        id: "location-1",
        slug: "providencia-demo",
        name: "Sucursal Providencia Demo",
        timezone: "America/Santiago",
        status: "ACTIVE",
      },
      {
        id: "location-2",
        slug: "nunoa-demo",
        name: "Sucursal Nunoa Demo",
        timezone: "America/Santiago",
        status: "ACTIVE",
      },
    ],
    businessHours: [
      {
        id: "hour-1",
        locationId: "location-1",
        weekday: "MONDAY",
        opensAtLocal: "10:00",
        closesAtLocal: "19:00",
        status: "ACTIVE",
      },
    ],
    weeklyRules: [
      {
        id: "rule-1",
        locationId: "location-1",
        weekday: "MONDAY",
        startsAtLocal: "10:00",
        endsAtLocal: "18:00",
        status: "ACTIVE",
      },
    ],
    timeOff: [
      {
        id: "time-off-1",
        locationId: "location-1",
        startsAt: "2026-07-01T14:00:00.000Z",
        endsAt: "2026-07-01T16:00:00.000Z",
        status: "ACTIVE",
      },
    ],
  });
  assert.equal(Object.prototype.hasOwnProperty.call(response, "slots"), false);
});

test("professional availability no expone campos sensibles", async () => {
  const { service } = serviceWithMockedDatabase({
    professional: {
      ...activeProfessional(),
      phone: "+56 9 0000 0000",
      email: "professional@example.invalid",
    },
    locations: [],
    timeOff: [
      {
        id: "time-off-1",
        locationId: null,
        startsAt: new Date("2026-07-01T14:00:00.000Z"),
        endsAt: new Date("2026-07-01T16:00:00.000Z"),
        reason: "Motivo interno",
        status: "ACTIVE",
      },
    ],
  });

  const responseJson = JSON.stringify(await service.getAvailability(
    tenantContext(),
    "professional-1",
  ));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("phone"), false);
  assert.equal(responseJson.includes("professional@example.invalid"), false);
  assert.equal(responseJson.includes("reason"), false);
  assert.equal(responseJson.includes("Motivo interno"), false);
  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("authSubject"), false);
  assert.equal(responseJson.includes("requestId"), false);
});
