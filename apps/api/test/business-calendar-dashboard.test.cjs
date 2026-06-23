const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessCalendarDashboardService,
} = require("../dist/businesses/business-calendar-dashboard.service.js");

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
    customerNotes: "Nota cliente",
    internalNotes: "Nota interna",
    publicTokenHash: "token-hash",
    bookingRequestId: "booking-request",
    cancellationReason: "Motivo cancelacion",
    depositPolicySnapshotJson: { secret: true },
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

function serviceWithMockedDatabase(rows = [], business = { timezone: "America/Santiago" }) {
  const queries = {};
  const database = {
    getClient: () => ({
      business: {
        findFirst: async (query) => {
          queries.business = query;
          return business;
        },
      },
      appointment: {
        findMany: async (query) => {
          queries.appointments = query;
          return rows;
        },
      },
    }),
  };

  return {
    service: new BusinessCalendarDashboardService(database),
    queries,
  };
}

function rejectsWithCode(action, status, code) {
  return assert.rejects(
    action,
    (error) => error.getStatus() === status
      && error.getResponse().code === code,
  );
}

function localTimeParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

test("business calendar usa businessId desde TenantContext en business lookup y appointment query", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  });

  assert.deepEqual(queries.business.where, {
    id: "business-tenant-1",
  });
  assert.deepEqual(queries.business.select, {
    timezone: true,
  });
  assert.equal(queries.appointments.where.businessId, "business-tenant-1");
});

test("business calendar aplica traslape real", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {
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

test("business calendar sin query usa inicio del dia del negocio hasta mas 7 dias", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {});

  const fromDate = queries.appointments.where.endAt.gt;
  const toDate = queries.appointments.where.startAt.lt;
  const parts = localTimeParts(fromDate, "America/Santiago");

  assert.equal(parts.hour, "00");
  assert.equal(parts.minute, "00");
  assert.equal(parts.second, "00");
  assert.equal(toDate.getTime() - fromDate.getTime(), 7 * 24 * 60 * 60 * 1000);
});

test("business calendar completa to cuando solo viene from", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
  });

  assert.deepEqual(queries.appointments.where.endAt, {
    gt: new Date("2026-07-01T00:00:00.000Z"),
  });
  assert.deepEqual(queries.appointments.where.startAt, {
    lt: new Date("2026-07-08T00:00:00.000Z"),
  });
});

test("business calendar completa from cuando solo viene to", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {
    to: "2026-07-08T00:00:00.000Z",
  });

  assert.deepEqual(queries.appointments.where.endAt, {
    gt: new Date("2026-07-01T00:00:00.000Z"),
  });
  assert.deepEqual(queries.appointments.where.startAt, {
    lt: new Date("2026-07-08T00:00:00.000Z"),
  });
});

test("business calendar rechaza fechas invalidas", async () => {
  const { service } = serviceWithMockedDatabase([]);

  await rejectsWithCode(
    () => service.getCalendar(tenantContext(), {
      from: "fecha-invalida",
      to: "2026-07-02T00:00:00.000Z",
    }),
    400,
    "CALENDAR_QUERY_INVALID",
  );
});

test("business calendar rechaza from mayor o igual a to", async () => {
  const { service } = serviceWithMockedDatabase([]);

  await rejectsWithCode(
    () => service.getCalendar(tenantContext(), {
      from: "2026-07-02T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
    }),
    400,
    "CALENDAR_QUERY_INVALID",
  );
});

test("business calendar rechaza rango mayor a 31 dias", async () => {
  const { service } = serviceWithMockedDatabase([]);

  await rejectsWithCode(
    () => service.getCalendar(tenantContext(), {
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-08-02T00:00:00.000Z",
    }),
    400,
    "CALENDAR_QUERY_INVALID",
  );
});

test("business calendar rechaza status invalido", async () => {
  const { service } = serviceWithMockedDatabase([]);

  await rejectsWithCode(
    () => service.getCalendar(tenantContext(), {
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
      status: "PENDING",
    }),
    400,
    "CALENDAR_QUERY_INVALID",
  );
});

test("business calendar rechaza locationId o professionalId vacio", async () => {
  const { service } = serviceWithMockedDatabase([]);

  await rejectsWithCode(
    () => service.getCalendar(tenantContext(), {
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
      locationId: " ",
    }),
    400,
    "CALENDAR_QUERY_INVALID",
  );
  await rejectsWithCode(
    () => service.getCalendar(tenantContext(), {
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-02T00:00:00.000Z",
      professionalId: "",
    }),
    400,
    "CALENDAR_QUERY_INVALID",
  );
});

test("business calendar aplica filtros tenant-safe por locationId professionalId y status", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
    locationId: "location-1",
    professionalId: "professional-1",
    status: "CANCELLED",
  });

  assert.equal(queries.appointments.where.locationId, "location-1");
  assert.equal(queries.appointments.where.status, "CANCELLED");
  assert.deepEqual(queries.appointments.where.segments, {
    some: {
      businessId: "business-tenant-1",
      professionalId: "professional-1",
    },
  });
});

test("business calendar sin status filtra por los cuatro estados de calendario", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  });

  assert.deepEqual(queries.appointments.where.status, {
    in: ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"],
  });
});

test("business calendar selecciona solo campos seguros", async () => {
  const { service, queries } = serviceWithMockedDatabase([]);

  await service.getCalendar(tenantContext(), {
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

test("business calendar mapea range summary localDate appointments seguros y profesionales deduplicados", async () => {
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
    appointmentRow({
      id: "appointment-2",
      status: "CANCELLED",
      startAt: new Date("2026-07-02T16:00:00.000Z"),
      endAt: new Date("2026-07-02T17:00:00.000Z"),
      segments: [],
    }),
  ]);

  assert.deepEqual(await service.getCalendar(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-03T00:00:00.000Z",
  }), {
    range: {
      from: "2026-07-01T00:00:00.000Z",
      to: "2026-07-03T00:00:00.000Z",
      timezone: "America/Santiago",
    },
    summary: {
      total: 2,
      byStatus: {
        CONFIRMED: 1,
        COMPLETED: 0,
        CANCELLED: 1,
        NO_SHOW: 0,
      },
    },
    appointments: [
      {
        id: "appointment-1",
        status: "CONFIRMED",
        source: "ADMIN",
        startAt: "2026-07-01T14:00:00.000Z",
        endAt: "2026-07-01T15:00:00.000Z",
        localDate: "2026-07-01",
        totalPriceClp: 26000,
        totalDurationMinutes: 60,
        currency: "CLP",
        timezone: "America/Santiago",
        isFirstVisit: false,
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
      {
        id: "appointment-2",
        status: "CANCELLED",
        source: "ADMIN",
        startAt: "2026-07-02T16:00:00.000Z",
        endAt: "2026-07-02T17:00:00.000Z",
        localDate: "2026-07-02",
        totalPriceClp: 26000,
        totalDurationMinutes: 60,
        currency: "CLP",
        timezone: "America/Santiago",
        isFirstVisit: false,
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
        professionals: [],
        segments: [],
      },
    ],
  });
});

test("business calendar summary.byStatus siempre trae las cuatro llaves", async () => {
  const { service } = serviceWithMockedDatabase([]);

  const response = await service.getCalendar(tenantContext(), {
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-02T00:00:00.000Z",
  });

  assert.deepEqual(response.summary.byStatus, {
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    NO_SHOW: 0,
  });
});

test("business calendar no expone notas, tokens, businessId ni datos sensibles", async () => {
  const { service } = serviceWithMockedDatabase([appointmentRow()]);

  const responseJson = JSON.stringify(await service.getCalendar(tenantContext(), {
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
  assert.equal(responseJson.includes("actorId"), false);
  assert.equal(responseJson.includes("requestId"), false);
  assert.equal(responseJson.includes("Nota cliente"), false);
  assert.equal(responseJson.includes("Nota interna"), false);
  assert.equal(responseJson.includes("token-hash"), false);
  assert.equal(responseJson.includes("professional@example.invalid"), false);
});
