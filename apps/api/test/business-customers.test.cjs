const assert = require("node:assert/strict");
const { test } = require("node:test");

const { BusinessCustomersService } = require("../dist/businesses/business-customers.service.js");

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

function serviceWithMockedDatabase({ customers = [], appointmentSummaries = [] }) {
  const queries = {};
  const database = {
    getClient: () => ({
      customer: {
        findMany: async (query) => {
          queries.customers = query;
          return customers;
        },
      },
      appointment: {
        groupBy: async (query) => {
          queries.appointments = query;
          return appointmentSummaries;
        },
      },
    }),
  };

  return {
    service: new BusinessCustomersService(database),
    queries,
  };
}

function customerRow(overrides = {}) {
  return {
    id: "customer-1",
    businessId: "business-tenant-1",
    firstName: "Nicolas",
    lastName: "Perez",
    phone: "+56 9 0000 1101",
    email: "nicolas@example.invalid",
    loyaltyTier: "PREFERRED",
    priorityScore: 45,
    isManualVip: false,
    preferencesNotes: "Prefiere tarde.",
    internalNotes: "Nota privada.",
    firstVisitAt: new Date("2026-06-01T10:00:00.000Z"),
    lastVisitAt: null,
    createdAt: new Date("2026-05-20T12:00:00.000Z"),
    updatedAt: new Date("2026-06-02T12:00:00.000Z"),
    ...overrides,
  };
}

test("business customers consulta clientes usando businessId desde TenantContext", async () => {
  const { service, queries } = serviceWithMockedDatabase({
    customers: [customerRow()],
  });

  await service.listCustomers(tenantContext());

  assert.deepEqual(queries.customers.where, {
    businessId: "business-tenant-1",
  });
  assert.deepEqual(queries.customers.orderBy, [
    { createdAt: "desc" },
    { lastName: "asc" },
    { firstName: "asc" },
    { id: "asc" },
  ]);
});

test("business customers usa select minimo sin historial completo", async () => {
  const { service, queries } = serviceWithMockedDatabase({
    customers: [customerRow()],
  });

  await service.listCustomers(tenantContext());

  assert.deepEqual(queries.customers.select, {
    id: true,
    firstName: true,
    lastName: true,
    phone: true,
    email: true,
    loyaltyTier: true,
    priorityScore: true,
    isManualVip: true,
    firstVisitAt: true,
    lastVisitAt: true,
    createdAt: true,
  });
  assert.equal(Object.prototype.hasOwnProperty.call(queries.customers.select, "appointments"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.customers.select, "waitlistEntries"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.customers.select, "retailOrders"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.customers.select, "productInquiries"), false);
});

test("business customers resume citas con groupBy tenant-safe", async () => {
  const { service, queries } = serviceWithMockedDatabase({
    customers: [
      customerRow({ id: "customer-1" }),
      customerRow({ id: "customer-2" }),
    ],
  });

  await service.listCustomers(tenantContext());

  assert.deepEqual(queries.appointments, {
    by: ["customerId"],
    where: {
      businessId: "business-tenant-1",
      customerId: {
        in: ["customer-1", "customer-2"],
      },
    },
    _count: {
      _all: true,
    },
    _max: {
      startAt: true,
    },
  });
});

test("business customers no consulta appointments cuando no hay clientes", async () => {
  const { service, queries } = serviceWithMockedDatabase({
    customers: [],
  });

  assert.deepEqual(await service.listCustomers(tenantContext()), []);
  assert.equal(Object.prototype.hasOwnProperty.call(queries, "appointments"), false);
});

test("business customers mapea fullName, VIP/lealtad, fechas y resumen de citas", async () => {
  const { service } = serviceWithMockedDatabase({
    customers: [
      customerRow(),
      customerRow({
        id: "customer-2",
        firstName: "Fernanda",
        lastName: null,
        email: null,
        loyaltyTier: "VIP",
        priorityScore: 90,
        isManualVip: true,
        firstVisitAt: null,
        lastVisitAt: new Date("2026-06-10T13:00:00.000Z"),
        createdAt: new Date("2026-05-21T12:00:00.000Z"),
      }),
    ],
    appointmentSummaries: [
      {
        customerId: "customer-1",
        _count: { _all: 3 },
        _max: { startAt: new Date("2026-06-22T15:00:00.000Z") },
      },
    ],
  });

  assert.deepEqual(await service.listCustomers(tenantContext()), [
    {
      id: "customer-1",
      fullName: "Nicolas Perez",
      firstName: "Nicolas",
      lastName: "Perez",
      phone: "+56 9 0000 1101",
      email: "nicolas@example.invalid",
      loyaltyTier: "PREFERRED",
      priorityScore: 45,
      isManualVip: false,
      firstVisitAt: "2026-06-01T10:00:00.000Z",
      lastVisitAt: null,
      createdAt: "2026-05-20T12:00:00.000Z",
      lastAppointmentAt: "2026-06-22T15:00:00.000Z",
      appointmentCount: 3,
    },
    {
      id: "customer-2",
      fullName: "Fernanda",
      firstName: "Fernanda",
      lastName: null,
      phone: "+56 9 0000 1101",
      email: null,
      loyaltyTier: "VIP",
      priorityScore: 90,
      isManualVip: true,
      firstVisitAt: null,
      lastVisitAt: "2026-06-10T13:00:00.000Z",
      createdAt: "2026-05-21T12:00:00.000Z",
      lastAppointmentAt: null,
      appointmentCount: 0,
    },
  ]);
});

test("business customers no expone campos sensibles ni relaciones completas", async () => {
  const { service } = serviceWithMockedDatabase({
    customers: [customerRow()],
    appointmentSummaries: [
      {
        customerId: "customer-1",
        _count: { _all: 1 },
        _max: { startAt: new Date("2026-06-22T15:00:00.000Z") },
      },
    ],
  });

  const responseJson = JSON.stringify(await service.listCustomers(tenantContext()));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("preferencesNotes"), false);
  assert.equal(responseJson.includes("internalNotes"), false);
  assert.equal(responseJson.includes("updatedAt"), false);
  assert.equal(responseJson.includes("waitlistEntries"), false);
  assert.equal(responseJson.includes("retailOrders"), false);
  assert.equal(responseJson.includes("productInquiries"), false);
  assert.equal(responseJson.includes("userId"), false);
  assert.equal(responseJson.includes("membershipId"), false);
  assert.equal(responseJson.includes("authSubject"), false);
  assert.equal(responseJson.includes("requestId"), false);
  assert.equal(responseJson.includes("Nota privada"), false);
});
