const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessAppointmentCreateService,
} = require("../dist/businesses/business-appointment-create.service.js");

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

function validBody(overrides = {}) {
  return {
    locationId: "location-1",
    customerId: "customer-1",
    startAt: "2026-07-01T14:00:00.000Z",
    serviceIds: ["service-2", "service-1"],
    professionalId: "professional-1",
    ...overrides,
  };
}

function businessRow(overrides = {}) {
  return {
    id: "business-tenant-1",
    currency: "CLP",
    timezone: "America/Santiago",
    ...overrides,
  };
}

function locationRow(overrides = {}) {
  return {
    id: "location-1",
    timezone: "America/Santiago",
    ...overrides,
  };
}

function customerRow(overrides = {}) {
  return {
    id: "customer-1",
    firstVisitAt: null,
    ...overrides,
  };
}

function serviceRows() {
  return [
    {
      id: "service-1",
      name: "Barba premium",
      basePriceClp: 9000,
      durationMinutes: 20,
    },
    {
      id: "service-2",
      name: "Corte premium",
      basePriceClp: 18000,
      durationMinutes: 40,
    },
  ];
}

function safeDetailResponse(overrides = {}) {
  return {
    id: "appointment-1",
    status: "CONFIRMED",
    source: "ADMIN",
    startAt: "2026-07-01T14:00:00.000Z",
    endAt: "2026-07-01T15:00:00.000Z",
    totalPriceClp: 27000,
    totalDurationMinutes: 60,
    currency: "CLP",
    timezone: "America/Santiago",
    isFirstVisit: true,
    createdAt: "2026-06-23T12:00:00.000Z",
    customer: {
      id: "customer-1",
      fullName: "Nicolas Perez",
      phone: "+56 9 0000 1101",
      email: "nicolas@example.invalid",
      loyaltyTier: "STANDARD",
      isManualVip: false,
    },
    location: {
      id: "location-1",
      name: "Sucursal Providencia Demo",
      slug: "providencia-demo",
    },
    services: [],
    professionals: [],
    segments: [],
    statusHistory: [],
    ...overrides,
  };
}

function serviceWithMocks(options = {}) {
  const calls = {
    appointmentServices: [],
    appointmentSegments: [],
  };
  const createdAppointmentId = options.createdAppointmentId ?? "appointment-1";
  const rows = {
    business: Object.prototype.hasOwnProperty.call(options, "business")
      ? options.business
      : businessRow(),
    location: Object.prototype.hasOwnProperty.call(options, "location")
      ? options.location
      : locationRow(),
    customer: Object.prototype.hasOwnProperty.call(options, "customer")
      ? options.customer
      : customerRow(),
    services: Object.prototype.hasOwnProperty.call(options, "services")
      ? options.services
      : serviceRows(),
    professional: Object.prototype.hasOwnProperty.call(options, "professional")
      ? options.professional
      : { id: "professional-1" },
    professionalServices: Object.prototype.hasOwnProperty.call(options, "professionalServices")
      ? options.professionalServices
      : [
        { serviceId: "service-1" },
        { serviceId: "service-2" },
      ],
  };

  const transactionClient = {
    business: {
      findFirst: async (query) => {
        calls.business = query;
        return rows.business;
      },
    },
    location: {
      findFirst: async (query) => {
        calls.location = query;
        return rows.location;
      },
    },
    customer: {
      findFirst: async (query) => {
        calls.customer = query;
        return rows.customer;
      },
    },
    service: {
      findMany: async (query) => {
        calls.services = query;
        return rows.services;
      },
    },
    professional: {
      findFirst: async (query) => {
        calls.professional = query;
        return rows.professional;
      },
    },
    professionalService: {
      findMany: async (query) => {
        calls.professionalServices = query;
        return rows.professionalServices;
      },
    },
    appointment: {
      create: async (query) => {
        calls.appointmentCreate = query;
        return { id: createdAppointmentId };
      },
    },
    appointmentService: {
      create: async (query) => {
        calls.appointmentServices.push(query);
        return {
          id: `appointment-service-${calls.appointmentServices.length}`,
        };
      },
    },
    appointmentSegment: {
      create: async (query) => {
        calls.appointmentSegments.push(query);
        return {
          id: `appointment-segment-${calls.appointmentSegments.length}`,
        };
      },
    },
    appointmentStatusHistory: {
      create: async (query) => {
        calls.statusHistoryCreate = query;
        return {
          id: "status-history-1",
        };
      },
    },
  };

  const transactions = {
    runInTransaction: async (callback) => {
      calls.transactionStarted = true;
      return callback(transactionClient);
    },
  };
  const appointmentDetail = {
    getAppointment: async (tenant, appointmentId) => {
      calls.detail = { tenant, appointmentId };
      return options.detailResponse ?? safeDetailResponse();
    },
  };

  return {
    service: new BusinessAppointmentCreateService(transactions, appointmentDetail),
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

test("business appointment create valida input minimo y APPOINTMENT_CREATE_INVALID_INPUT", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), {}),
    400,
    "APPOINTMENT_CREATE_INVALID_INPUT",
  );
});

test("business appointment create rechaza serviceIds vacio", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody({ serviceIds: [] })),
    400,
    "APPOINTMENT_CREATE_INVALID_INPUT",
  );
});

test("business appointment create rechaza serviceIds duplicados", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody({
      serviceIds: ["service-1", "service-1"],
    })),
    400,
    "APPOINTMENT_CREATE_INVALID_INPUT",
  );
});

test("business appointment create rechaza startAt invalido", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody({ startAt: "fecha-invalida" })),
    400,
    "APPOINTMENT_CREATE_INVALID_INPUT",
  );
});

test("business appointment create rechaza source invalido", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody({ source: "CALLCENTER" })),
    400,
    "APPOINTMENT_CREATE_INVALID_INPUT",
  );
});

test("business appointment create usa businessId desde TenantContext en lecturas y escrituras", async () => {
  const { service, calls } = serviceWithMocks();

  await service.createAppointment(tenantContext(), validBody());

  assert.equal(calls.business.where.id, "business-tenant-1");
  assert.equal(calls.location.where.businessId, "business-tenant-1");
  assert.equal(calls.customer.where.businessId, "business-tenant-1");
  assert.equal(calls.services.where.businessId, "business-tenant-1");
  assert.equal(calls.professional.where.businessId, "business-tenant-1");
  assert.equal(calls.professionalServices.where.businessId, "business-tenant-1");
  assert.equal(calls.appointmentCreate.data.businessId, "business-tenant-1");
  assert.equal(calls.appointmentServices[0].data.businessId, "business-tenant-1");
  assert.equal(calls.appointmentSegments[0].data.businessId, "business-tenant-1");
  assert.equal(calls.statusHistoryCreate.data.businessId, "business-tenant-1");
});

test("business appointment create selecciona campos minimos para validar entidades", async () => {
  const { service, calls } = serviceWithMocks();

  await service.createAppointment(tenantContext(), validBody());

  assert.deepEqual(calls.business.select, {
    id: true,
    currency: true,
    timezone: true,
  });
  assert.deepEqual(calls.location.select, {
    id: true,
    timezone: true,
  });
  assert.deepEqual(calls.customer.select, {
    id: true,
    firstVisitAt: true,
  });
  assert.deepEqual(calls.services.select, {
    id: true,
    name: true,
    basePriceClp: true,
    durationMinutes: true,
  });
  assert.deepEqual(calls.professional.select, {
    id: true,
  });
  assert.deepEqual(calls.professionalServices.select, {
    serviceId: true,
  });
});

test("business appointment create rechaza location fuera de tenant o inactiva", async () => {
  const { service } = serviceWithMocks({ location: null });

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody()),
    404,
    "LOCATION_NOT_FOUND",
  );
});

test("business appointment create rechaza customer fuera de tenant", async () => {
  const { service } = serviceWithMocks({ customer: null });

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody()),
    404,
    "CUSTOMER_NOT_FOUND",
  );
});

test("business appointment create rechaza service fuera de tenant o inactivo", async () => {
  const { service } = serviceWithMocks({ services: [serviceRows()[0]] });

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody()),
    404,
    "SERVICE_NOT_FOUND",
  );
});

test("business appointment create rechaza professional fuera de tenant o inactivo", async () => {
  const { service } = serviceWithMocks({ professional: null });

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody()),
    404,
    "PROFESSIONAL_NOT_FOUND",
  );
});

test("business appointment create rechaza professional sin ProfessionalService activo", async () => {
  const { service } = serviceWithMocks({
    professionalServices: [{ serviceId: "service-1" }],
  });

  await rejectsWithCode(
    () => service.createAppointment(tenantContext(), validBody()),
    400,
    "PROFESSIONAL_SERVICE_NOT_ALLOWED",
  );
});

test("business appointment create calcula duracion, precio, endAt, snapshots y primera visita", async () => {
  const { service, calls } = serviceWithMocks({
    location: locationRow({ timezone: null }),
    business: businessRow({ timezone: "America/Santiago", currency: "CLP" }),
  });

  await service.createAppointment(tenantContext(), validBody({ source: "WHATSAPP" }));

  assert.deepEqual(calls.appointmentCreate.data, {
    businessId: "business-tenant-1",
    locationId: "location-1",
    customerId: "customer-1",
    status: "CONFIRMED",
    source: "WHATSAPP",
    startAt: new Date("2026-07-01T14:00:00.000Z"),
    endAt: new Date("2026-07-01T15:00:00.000Z"),
    totalPriceClp: 27000,
    totalDurationMinutes: 60,
    currencySnapshot: "CLP",
    timezoneSnapshot: "America/Santiago",
    isFirstVisit: true,
    depositRequiredSnapshot: false,
  });
});

test("business appointment create usa ADMIN como source por defecto", async () => {
  const { service, calls } = serviceWithMocks();

  await service.createAppointment(tenantContext(), validBody());

  assert.equal(calls.appointmentCreate.data.source, "ADMIN");
});

test("business appointment create crea AppointmentService con snapshots y secuencia preservando serviceIds", async () => {
  const { service, calls } = serviceWithMocks();

  await service.createAppointment(tenantContext(), validBody());

  assert.deepEqual(calls.appointmentServices.map((query) => query.data), [
    {
      businessId: "business-tenant-1",
      appointmentId: "appointment-1",
      serviceId: "service-2",
      sequence: 1,
      serviceNameSnapshot: "Corte premium",
      servicePriceClpSnapshot: 18000,
      serviceDurationMinutesSnapshot: 40,
    },
    {
      businessId: "business-tenant-1",
      appointmentId: "appointment-1",
      serviceId: "service-1",
      sequence: 2,
      serviceNameSnapshot: "Barba premium",
      servicePriceClpSnapshot: 9000,
      serviceDurationMinutesSnapshot: 20,
    },
  ]);
});

test("business appointment create crea AppointmentSegment secuenciales si viene professionalId", async () => {
  const { service, calls } = serviceWithMocks();

  await service.createAppointment(tenantContext(), validBody());

  assert.deepEqual(calls.appointmentSegments.map((query) => query.data), [
    {
      businessId: "business-tenant-1",
      appointmentId: "appointment-1",
      appointmentServiceId: "appointment-service-1",
      professionalId: "professional-1",
      locationId: "location-1",
      sequence: 1,
      startsAt: new Date("2026-07-01T14:00:00.000Z"),
      endsAt: new Date("2026-07-01T14:40:00.000Z"),
      blocksAvailability: true,
      status: "SCHEDULED",
    },
    {
      businessId: "business-tenant-1",
      appointmentId: "appointment-1",
      appointmentServiceId: "appointment-service-2",
      professionalId: "professional-1",
      locationId: "location-1",
      sequence: 2,
      startsAt: new Date("2026-07-01T14:40:00.000Z"),
      endsAt: new Date("2026-07-01T15:00:00.000Z"),
      blocksAvailability: true,
      status: "SCHEDULED",
    },
  ]);
});

test("business appointment create no crea AppointmentSegment si no viene professionalId", async () => {
  const { service, calls } = serviceWithMocks();
  const body = validBody();
  delete body.professionalId;

  await service.createAppointment(tenantContext(), body);

  assert.equal(calls.professional, undefined);
  assert.equal(calls.professionalServices, undefined);
  assert.deepEqual(calls.appointmentSegments, []);
});

test("business appointment create crea AppointmentStatusHistory", async () => {
  const { service, calls } = serviceWithMocks();

  await service.createAppointment(tenantContext(), validBody());

  assert.deepEqual(calls.statusHistoryCreate.data, {
    businessId: "business-tenant-1",
    appointmentId: "appointment-1",
    previousStatus: null,
    nextStatus: "CONFIRMED",
    actorType: "ADMIN",
    actorId: "user-1",
  });
});

test("business appointment create devuelve detalle seguro usando BusinessAppointmentDetailService", async () => {
  const detailResponse = safeDetailResponse({ id: "appointment-created-1" });
  const { service, calls } = serviceWithMocks({
    createdAppointmentId: "appointment-created-1",
    detailResponse,
  });

  const response = await service.createAppointment(tenantContext(), validBody());

  assert.equal(calls.transactionStarted, true);
  assert.deepEqual(calls.detail, {
    tenant: tenantContext(),
    appointmentId: "appointment-created-1",
  });
  assert.deepEqual(response, detailResponse);
});

test("business appointment create no expone campos sensibles en respuesta", async () => {
  const { service } = serviceWithMocks();

  const responseJson = JSON.stringify(await service.createAppointment(
    tenantContext(),
    validBody(),
  ));

  assert.equal(responseJson.includes("businessId"), false);
  assert.equal(responseJson.includes("internalNotes"), false);
  assert.equal(responseJson.includes("customerNotes"), false);
  assert.equal(responseJson.includes("publicTokenHash"), false);
  assert.equal(responseJson.includes("bookingRequestId"), false);
  assert.equal(responseJson.includes("depositPolicySnapshotJson"), false);
  assert.equal(responseJson.includes("cancellationReason"), false);
  assert.equal(responseJson.includes("actorId"), false);
  assert.equal(responseJson.includes("requestId"), false);
  assert.equal(responseJson.includes("authSubject"), false);
  assert.equal(responseJson.includes("membershipId"), false);
});
