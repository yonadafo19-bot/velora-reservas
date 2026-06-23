const assert = require("node:assert/strict");
const { test } = require("node:test");

const { BusinessAppointmentsService } = require("../dist/businesses/business-appointments.service.js");

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
    status: "CONFIRMED",
    source: "ADMIN",
    startAt: new Date("2026-07-01T14:00:00.000Z"),
    endAt: new Date("2026-07-01T15:00:00.000Z"),
    totalPriceClp: 26000,
    totalDurationMinutes: 60,
    currencySnapshot: "CLP",
    timezoneSnapshot: "America/Santiago",
    isFirstVisit: false,
    createdAt: new Date("2026-06-23T12:00:00.000Z"),
    customerNotes: "Nota cliente",
    internalNotes: "Nota interna",
    publicTokenHash: "token-hash",
    bookingRequestId: "booking-request",
    cancellationReason: "Motivo cancelacion",
    depositPolicySnapshotJson: { secret: true },
    updatedAt: new Date("2026-06-23T13:00:00.000Z"),
    statusHistory: [{ id: "history-1" }],
    customer: {
      id: "customer-1",
      firstName: "Nicolas",
      lastName: "Perez",
      phone: "+56 9 0000 1101",
      email: "nicolas@example.invalid",
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
    ...overrides,
  };
}

function serviceWithMockedDatabase(rows = []) {
  const queries = {};
  const database = {
    getClient: () => ({
      appointment: {
        findMany: async (query) => {
          queries.appointments = query;
          return rows;
        },
      },
    }),
  };

  return {
    service: new BusinessAppointmentsService(database),
    queries,
  };
}

test("business appointments consulta Prisma usando businessId desde TenantContext", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.listAppointments(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  });

  assert.equal(queries.appointments.where.businessId, "business-tenant-1");
});

test("business appointments aplica from/to con traslape real", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.listAppointments(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  });

  assert.deepEqual(queries.appointments.where.startAt, {
    lt: new Date("2026-07-02T00:00:00.000Z"),
  });
  assert.deepEqual(queries.appointments.where.endAt, {
    gt: new Date("2026-07-01T00:00:00.000Z"),
  });
  assert.deepEqual(queries.appointments.orderBy, [
    { startAt: "asc" },
    { id: "asc" },
  ]);
});

test("business appointments sin from/to usa rango por defecto", async () => {
  const before = Date.now();
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.listAppointments(tenantContext(), {});

  const fromTime = queries.appointments.where.endAt.gt.getTime();
  const toTime = queries.appointments.where.startAt.lt.getTime();
  const after = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  assert.ok(fromTime >= before);
  assert.ok(fromTime <= after);
  assert.equal(toTime - fromTime, fourteenDaysMs);
});

test("business appointments completa to cuando solo viene from", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.listAppointments(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
  });

  assert.deepEqual(queries.appointments.where.endAt, {
    gt: new Date("2026-07-01T00:00:00.000Z"),
  });
  assert.deepEqual(queries.appointments.where.startAt, {
    lt: new Date("2026-07-15T00:00:00.000Z"),
  });
});

test("business appointments rechaza from/to invalidos", async () => {
  const { service } = serviceWithMockedDatabase([]);

  await assert.rejects(
    () => service.listAppointments(tenantContext(), {
      from: "fecha-invalida",
      to: "2026-07-02T00:00:00.000Z",
    }),
    (error) => error.getStatus() === 400
      && error.getResponse().code === "APPOINTMENT_DATE_RANGE_INVALID",
  );
});

test("business appointments rechaza from mayor o igual a to", async () => {
  const { service } = serviceWithMockedDatabase([]);

  await assert.rejects(
    () => service.listAppointments(tenantContext(), {
      from: "2026-07-02T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
    }),
    (error) => error.getStatus() === 400
      && error.getResponse().code === "APPOINTMENT_DATE_RANGE_INVALID",
  );
});

test("business appointments selecciona solo campos necesarios", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.listAppointments(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  });

  assert.deepEqual(queries.appointments.select, {
    id: true,
    status: true,
    source: true,
    startAt: true,
    endAt: true,
    totalPriceClp: true,
    totalDurationMinutes: true,
    currencySnapshot: true,
    timezoneSnapshot: true,
    isFirstVisit: true,
    createdAt: true,
    customer: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    },
    location: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    services: {
      select: {
        id: true,
        serviceId: true,
        packId: true,
        sequence: true,
        serviceNameSnapshot: true,
        servicePriceClpSnapshot: true,
        serviceDurationMinutesSnapshot: true,
      },
      orderBy: [
        { sequence: "asc" },
        { id: "asc" },
      ],
    },
    segments: {
      select: {
        id: true,
        professionalId: true,
        locationId: true,
        sequence: true,
        startsAt: true,
        endsAt: true,
        status: true,
        professional: {
          select: {
            id: true,
            displayName: true,
            roleTitle: true,
          },
        },
      },
      orderBy: [
        { sequence: "asc" },
        { startsAt: "asc" },
        { id: "asc" },
      ],
    },
  });
});

test("business appointments mapea customer, snapshots, profesionales deduplicados y fechas ISO", async () => {
  const { service } = serviceWithMockedDatabase([
    appointmentRow({
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
          },
        },
      ],
    }),
  ]);

  assert.deepEqual(await service.listAppointments(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  }), [
    {
      id: "appointment-1",
      status: "CONFIRMED",
      source: "ADMIN",
      startAt: "2026-07-01T14:00:00.000Z",
      endAt: "2026-07-01T15:00:00.000Z",
      totalPriceClp: 26000,
      totalDurationMinutes: 60,
      currency: "CLP",
      timezone: "America/Santiago",
      isFirstVisit: false,
      createdAt: "2026-06-23T12:00:00.000Z",
      customer: {
        id: "customer-1",
        fullName: "Nicolas Perez",
        phone: "+56 9 0000 1101",
        email: "nicolas@example.invalid",
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
    },
  ]);
});

test("business appointments no expone notas, tokens, businessId ni datos sensibles", async () => {
  const { service } = serviceWithMockedDatabase([appointmentRow()]);

  const responseJson = JSON.stringify(await service.listAppointments(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  }));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("customerNotes"), false);
  assert.equal(responseJson.includes("internalNotes"), false);
  assert.equal(responseJson.includes("publicTokenHash"), false);
  assert.equal(responseJson.includes("bookingRequestId"), false);
  assert.equal(responseJson.includes("depositPolicySnapshotJson"), false);
  assert.equal(responseJson.includes("statusHistory"), false);
  assert.equal(responseJson.includes("cancellationReason"), false);
  assert.equal(responseJson.includes("updatedAt"), false);
  assert.equal(responseJson.includes("Nota cliente"), false);
  assert.equal(responseJson.includes("Nota interna"), false);
  assert.equal(responseJson.includes("token-hash"), false);
  assert.equal(responseJson.includes("professional@example.invalid"), false);
});
