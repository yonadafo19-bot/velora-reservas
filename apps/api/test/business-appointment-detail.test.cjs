const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessAppointmentDetailService,
} = require("../dist/businesses/business-appointment-detail.service.js");

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

function appointmentRow(overrides = {}) {
  return {
    id: "appointment-1",
    businessId: "business-tenant-1",
    status: "CANCELLED",
    source: "ADMIN",
    startAt: new Date("2026-07-01T14:00:00.000Z"),
    endAt: new Date("2026-07-01T15:00:00.000Z"),
    totalPriceClp: 26000,
    totalDurationMinutes: 60,
    currencySnapshot: "CLP",
    timezoneSnapshot: "America/Santiago",
    isFirstVisit: true,
    createdAt: new Date("2026-06-23T12:00:00.000Z"),
    cancelledAt: new Date("2026-06-24T12:00:00.000Z"),
    cancellationSource: "ADMIN",
    isLateCancellation: true,
    markedNoShowAt: null,
    depositRequiredSnapshot: true,
    customerNotes: "Nota cliente",
    internalNotes: "Nota interna",
    publicTokenHash: "token-hash",
    bookingRequestId: "booking-request",
    cancellationReason: "Motivo privado",
    depositPolicySnapshotJson: { secret: true },
    updatedAt: new Date("2026-06-23T13:00:00.000Z"),
    customer: {
      id: "customer-1",
      firstName: "Nicolas",
      lastName: "Perez",
      phone: "+56 9 0000 1101",
      email: "nicolas@example.invalid",
      loyaltyTier: "VIP",
      isManualVip: true,
    },
    location: {
      id: "location-1",
      name: "Sucursal Providencia Demo",
      slug: "providencia-demo",
    },
    services: [
      {
        id: "appointment-service-1",
        serviceId: "service-1",
        packId: null,
        sequence: 1,
        serviceNameSnapshot: "Corte premium",
        servicePriceClpSnapshot: 26000,
        serviceDurationMinutesSnapshot: 60,
      },
    ],
    segments: [
      {
        id: "segment-1",
        professionalId: "professional-1",
        locationId: "location-1",
        sequence: 1,
        startsAt: new Date("2026-07-01T14:00:00.000Z"),
        endsAt: new Date("2026-07-01T14:30:00.000Z"),
        status: "SCHEDULED",
        professional: {
          id: "professional-1",
          displayName: "Matias Rojas",
          roleTitle: "Barbero senior",
          phone: "+56 9 0000 0000",
          email: "professional@example.invalid",
        },
      },
      {
        id: "segment-2",
        professionalId: "professional-1",
        locationId: "location-1",
        sequence: 2,
        startsAt: new Date("2026-07-01T14:30:00.000Z"),
        endsAt: new Date("2026-07-01T15:00:00.000Z"),
        status: "SCHEDULED",
        professional: {
          id: "professional-1",
          displayName: "Matias Rojas",
          roleTitle: "Barbero senior",
          phone: "+56 9 0000 0000",
          email: "professional@example.invalid",
        },
      },
    ],
    statusHistory: [
      {
        id: "history-1",
        previousStatus: "PENDING",
        nextStatus: "CONFIRMED",
        actorType: "ADMIN",
        actorId: "user-1",
        requestId: "request-1",
        reason: "Motivo interno",
        createdAt: new Date("2026-06-23T12:30:00.000Z"),
      },
    ],
    ...overrides,
  };
}

function serviceWithMockedDatabase(row) {
  const queries = {};
  const database = {
    getClient: () => ({
      appointment: {
        findFirst: async (query) => {
          queries.appointment = query;
          return row;
        },
      },
    }),
  };

  return {
    service: new BusinessAppointmentDetailService(database),
    queries,
  };
}

test("business appointment detail consulta usando appointmentId y businessId desde TenantContext", async () => {
  const { service, queries } = serviceWithMockedDatabase(appointmentRow());

  await service.getAppointment(tenantContext(), "appointment-1");

  assert.deepEqual(queries.appointment.where, {
    id: "appointment-1",
    businessId: "business-tenant-1",
  });
});

test("business appointment detail lanza 404 APPOINTMENT_NOT_FOUND si no existe", async () => {
  const { service } = serviceWithMockedDatabase(null);

  await assert.rejects(
    () => service.getAppointment(tenantContext(), "missing-appointment"),
    (error) => error.getStatus() === 404
      && error.getResponse().code === "APPOINTMENT_NOT_FOUND",
  );
});

test("business appointment detail selecciona solo campos seguros", async () => {
  const { service, queries } = serviceWithMockedDatabase(appointmentRow());

  await service.getAppointment(tenantContext(), "appointment-1");

  assert.deepEqual(queries.appointment.select.statusHistory.select, {
    id: true,
    previousStatus: true,
    nextStatus: true,
    actorType: true,
    createdAt: true,
  });
  assert.deepEqual(queries.appointment.select.statusHistory.orderBy, [
    { createdAt: "asc" },
    { id: "asc" },
  ]);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.appointment.select, "customerNotes"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.appointment.select, "internalNotes"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.appointment.select, "publicTokenHash"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.appointment.select, "bookingRequestId"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.appointment.select, "depositPolicySnapshotJson"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.appointment.select, "cancellationReason"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(queries.appointment.select, "updatedAt"), false);
});

test("business appointment detail mapea campos principales, fechas ISO/null y snapshots", async () => {
  const { service } = serviceWithMockedDatabase(appointmentRow({
    cancelledAt: null,
    markedNoShowAt: new Date("2026-07-01T15:05:00.000Z"),
  }));

  assert.deepEqual(await service.getAppointment(tenantContext(), "appointment-1"), {
    id: "appointment-1",
    status: "CANCELLED",
    source: "ADMIN",
    startAt: "2026-07-01T14:00:00.000Z",
    endAt: "2026-07-01T15:00:00.000Z",
    totalPriceClp: 26000,
    totalDurationMinutes: 60,
    currency: "CLP",
    timezone: "America/Santiago",
    isFirstVisit: true,
    createdAt: "2026-06-23T12:00:00.000Z",
    cancelledAt: null,
    cancellationSource: "ADMIN",
    isLateCancellation: true,
    markedNoShowAt: "2026-07-01T15:05:00.000Z",
    depositRequired: true,
    customer: {
      id: "customer-1",
      fullName: "Nicolas Perez",
      phone: "+56 9 0000 1101",
      email: "nicolas@example.invalid",
      loyaltyTier: "VIP",
      isManualVip: true,
    },
    location: {
      id: "location-1",
      name: "Sucursal Providencia Demo",
      slug: "providencia-demo",
    },
    services: [
      {
        id: "appointment-service-1",
        serviceId: "service-1",
        packId: null,
        sequence: 1,
        name: "Corte premium",
        durationMinutes: 60,
        priceClp: 26000,
      },
    ],
    professionals: [
      {
        id: "professional-1",
        displayName: "Matias Rojas",
        roleTitle: "Barbero senior",
      },
    ],
    segments: [
      {
        id: "segment-1",
        professionalId: "professional-1",
        locationId: "location-1",
        sequence: 1,
        startsAt: "2026-07-01T14:00:00.000Z",
        endsAt: "2026-07-01T14:30:00.000Z",
        status: "SCHEDULED",
      },
      {
        id: "segment-2",
        professionalId: "professional-1",
        locationId: "location-1",
        sequence: 2,
        startsAt: "2026-07-01T14:30:00.000Z",
        endsAt: "2026-07-01T15:00:00.000Z",
        status: "SCHEDULED",
      },
    ],
    statusHistory: [
      {
        id: "history-1",
        fromStatus: "PENDING",
        toStatus: "CONFIRMED",
        actorType: "ADMIN",
        changedAt: "2026-06-23T12:30:00.000Z",
      },
    ],
  });
});

test("business appointment detail no expone campos sensibles", async () => {
  const { service } = serviceWithMockedDatabase(appointmentRow());

  const responseJson = JSON.stringify(await service.getAppointment(
    tenantContext(),
    "appointment-1",
  ));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("publicTokenHash"), false);
  assert.equal(responseJson.includes("bookingRequestId"), false);
  assert.equal(responseJson.includes("depositPolicySnapshotJson"), false);
  assert.equal(responseJson.includes("customerNotes"), false);
  assert.equal(responseJson.includes("internalNotes"), false);
  assert.equal(responseJson.includes("cancellationReason"), false);
  assert.equal(responseJson.includes("updatedAt"), false);
  assert.equal(responseJson.includes("actorId"), false);
  assert.equal(responseJson.includes("requestId"), false);
  assert.equal(responseJson.includes("reason"), false);
  assert.equal(responseJson.includes("professional@example.invalid"), false);
  assert.equal(responseJson.includes("Nota cliente"), false);
  assert.equal(responseJson.includes("Nota interna"), false);
  assert.equal(responseJson.includes("token-hash"), false);
  assert.equal(responseJson.includes("booking-request"), false);
  assert.equal(responseJson.includes("Motivo privado"), false);
  assert.equal(responseJson.includes("Motivo interno"), false);
});
