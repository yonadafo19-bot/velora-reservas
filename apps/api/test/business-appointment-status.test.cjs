const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  BusinessAppointmentStatusService,
} = require("../dist/businesses/business-appointment-status.service.js");

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
    status: "CONFIRMED",
    ...overrides,
  };
}

function safeDetailResponse(overrides = {}) {
  return {
    id: "appointment-1",
    status: "COMPLETED",
    source: "ADMIN",
    startAt: "2026-07-01T14:00:00.000Z",
    endAt: "2026-07-01T15:00:00.000Z",
    totalPriceClp: 27000,
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
    segmentUpdates: [],
  };
  const rows = {
    appointment: Object.prototype.hasOwnProperty.call(options, "appointment")
      ? options.appointment
      : appointmentRow(),
    updateCount: Object.prototype.hasOwnProperty.call(options, "updateCount")
      ? options.updateCount
      : 1,
  };

  const transactionClient = {
    appointment: {
      findFirst: async (query) => {
        calls.appointmentFindFirst = query;
        return rows.appointment;
      },
      updateMany: async (query) => {
        calls.appointmentUpdateMany = query;
        return { count: rows.updateCount };
      },
    },
    appointmentSegment: {
      updateMany: async (query) => {
        calls.segmentUpdates.push(query);
        return { count: 2 };
      },
    },
    appointmentStatusHistory: {
      create: async (query) => {
        calls.statusHistoryCreate = query;
        return { id: "history-1" };
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
    service: new BusinessAppointmentStatusService(transactions, appointmentDetail),
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

test("business appointment status valida input minimo y APPOINTMENT_STATUS_INVALID_INPUT", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", {}),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
});

test("business appointment status rechaza status invalido", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", { status: "PENDING" }),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
});

test("business appointment status rechaza CONFIRMED como destino", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", { status: "CONFIRMED" }),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
});

test("business appointment status rechaza reason no string, vacio o mayor a 500 caracteres", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", {
      status: "COMPLETED",
      reason: 123,
    }),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", {
      status: "COMPLETED",
      reason: "   ",
    }),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", {
      status: "COMPLETED",
      reason: "a".repeat(501),
    }),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
});

test("business appointment status rechaza cancellationSource invalido", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", {
      status: "CANCELLED",
      cancellationSource: "CALLCENTER",
    }),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
});

test("business appointment status rechaza cancellationSource para estado distinto de CANCELLED", async () => {
  const { service } = serviceWithMocks();

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", {
      status: "COMPLETED",
      cancellationSource: "ADMIN",
    }),
    400,
    "APPOINTMENT_STATUS_INVALID_INPUT",
  );
});

test("business appointment status consulta cita usando appointmentId y businessId desde TenantContext", async () => {
  const { service, calls } = serviceWithMocks();

  await service.updateStatus(tenantContext(), "appointment-1", { status: "COMPLETED" });

  assert.deepEqual(calls.appointmentFindFirst.where, {
    id: "appointment-1",
    businessId: "business-tenant-1",
  });
  assert.deepEqual(calls.appointmentFindFirst.select, {
    id: true,
    status: true,
  });
});

test("business appointment status lanza APPOINTMENT_NOT_FOUND si la cita no existe en el tenant", async () => {
  const { service } = serviceWithMocks({ appointment: null });

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", { status: "COMPLETED" }),
    404,
    "APPOINTMENT_NOT_FOUND",
  );
});

test("business appointment status permite CONFIRMED a COMPLETED con update tenant-safe y guardia de estado", async () => {
  const { service, calls } = serviceWithMocks();

  await service.updateStatus(tenantContext(), "appointment-1", { status: "COMPLETED" });

  assert.deepEqual(calls.appointmentUpdateMany.where, {
    id: "appointment-1",
    businessId: "business-tenant-1",
    status: "CONFIRMED",
  });
  assert.deepEqual(calls.appointmentUpdateMany.data, {
    status: "COMPLETED",
  });
  assert.deepEqual(calls.segmentUpdates, [
    {
      where: {
        appointmentId: "appointment-1",
        businessId: "business-tenant-1",
      },
      data: {
        status: "COMPLETED",
      },
    },
  ]);
});

test("business appointment status permite CONFIRMED a CANCELLED con campos de cancelacion", async () => {
  const { service, calls } = serviceWithMocks();

  await service.updateStatus(tenantContext(), "appointment-1", {
    status: "CANCELLED",
    cancellationSource: "CUSTOMER",
  });

  assert.equal(calls.appointmentUpdateMany.data.status, "CANCELLED");
  assert.ok(calls.appointmentUpdateMany.data.cancelledAt instanceof Date);
  assert.equal(calls.appointmentUpdateMany.data.cancellationSource, "CUSTOMER");
  assert.equal(calls.appointmentUpdateMany.data.isLateCancellation, false);
  assert.deepEqual(calls.segmentUpdates[0].data, {
    status: "CANCELLED",
  });
});

test("business appointment status usa ADMIN como cancellationSource por defecto", async () => {
  const { service, calls } = serviceWithMocks();

  await service.updateStatus(tenantContext(), "appointment-1", { status: "CANCELLED" });

  assert.equal(calls.appointmentUpdateMany.data.cancellationSource, "ADMIN");
});

test("business appointment status permite CONFIRMED a NO_SHOW sin tocar segments", async () => {
  const { service, calls } = serviceWithMocks();

  await service.updateStatus(tenantContext(), "appointment-1", { status: "NO_SHOW" });

  assert.equal(calls.appointmentUpdateMany.data.status, "NO_SHOW");
  assert.ok(calls.appointmentUpdateMany.data.markedNoShowAt instanceof Date);
  assert.deepEqual(calls.segmentUpdates, []);
});

test("business appointment status rechaza transiciones invalidas", async () => {
  const { service } = serviceWithMocks({
    appointment: appointmentRow({ status: "CANCELLED" }),
  });

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", { status: "COMPLETED" }),
    400,
    "APPOINTMENT_STATUS_TRANSITION_INVALID",
  );
});

test("business appointment status rechaza mismo estado", async () => {
  const { service } = serviceWithMocks({
    appointment: appointmentRow({ status: "COMPLETED" }),
  });

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", { status: "COMPLETED" }),
    400,
    "APPOINTMENT_STATUS_TRANSITION_INVALID",
  );
});

test("business appointment status rechaza carrera si updateMany no actualiza una fila", async () => {
  const { service } = serviceWithMocks({ updateCount: 0 });

  await rejectsWithCode(
    () => service.updateStatus(tenantContext(), "appointment-1", { status: "COMPLETED" }),
    400,
    "APPOINTMENT_STATUS_TRANSITION_INVALID",
  );
});

test("business appointment status crea AppointmentStatusHistory con actor admin y reason normalizado", async () => {
  const { service, calls } = serviceWithMocks();

  await service.updateStatus(tenantContext(), "appointment-1", {
    status: "CANCELLED",
    reason: "  Cliente aviso por WhatsApp  ",
  });

  assert.deepEqual(calls.statusHistoryCreate.data, {
    businessId: "business-tenant-1",
    appointmentId: "appointment-1",
    previousStatus: "CONFIRMED",
    nextStatus: "CANCELLED",
    actorType: "ADMIN",
    actorId: "user-1",
    reason: "Cliente aviso por WhatsApp",
  });
});

test("business appointment status devuelve detalle seguro usando BusinessAppointmentDetailService", async () => {
  const detailResponse = safeDetailResponse({ id: "appointment-1", status: "NO_SHOW" });
  const { service, calls } = serviceWithMocks({ detailResponse });

  const response = await service.updateStatus(tenantContext(), "appointment-1", {
    status: "NO_SHOW",
  });

  assert.equal(calls.transactionStarted, true);
  assert.deepEqual(calls.detail, {
    tenant: tenantContext(),
    appointmentId: "appointment-1",
  });
  assert.deepEqual(response, detailResponse);
});

test("business appointment status no expone campos sensibles en respuesta", async () => {
  const { service } = serviceWithMocks();

  const responseJson = JSON.stringify(await service.updateStatus(
    tenantContext(),
    "appointment-1",
    { status: "COMPLETED" },
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
