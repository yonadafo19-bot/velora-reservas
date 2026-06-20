const assert = require("node:assert/strict");
const { test } = require("node:test");

const { TenantGuard } = require("../dist/tenancy/tenant.guard.js");

function executionContext(request) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  };
}

function requestWithMembership(role = "ADMIN") {
  return {
    headers: {},
    params: { businessSlug: "negocio-autorizado" },
    user: {
      id: "user-1",
      authSubject: "subject-1",
      email: "admin@example.invalid",
      memberships: [
        {
          id: "membership-1",
          businessId: "business-1",
          businessSlug: "negocio-autorizado",
          businessName: "Negocio autorizado",
          businessVertical: "BARBERSHOP",
          role,
        },
      ],
    },
  };
}

test("rechaza acceso cuando no existe una membresía activa para el slug", () => {
  const reflector = { getAllAndOverride: () => [] };
  const guard = new TenantGuard(reflector, { set: () => undefined });
  const request = requestWithMembership();
  request.params.businessSlug = "otro-negocio";

  assert.throws(
    () => guard.canActivate(executionContext(request)),
    (error) => error.getStatus() === 403
      && error.getResponse().code === "TENANT_ACCESS_DENIED",
  );
});

test("rechaza acceso cuando el rol de la membresía es insuficiente", () => {
  const reflector = { getAllAndOverride: () => ["OWNER"] };
  const guard = new TenantGuard(reflector, { set: () => undefined });

  assert.throws(
    () => guard.canActivate(executionContext(requestWithMembership("PROFESSIONAL"))),
    (error) => error.getStatus() === 403
      && error.getResponse().code === "TENANT_ROLE_FORBIDDEN",
  );
});

test("deriva el tenant solo desde la membresía autenticada", () => {
  let storedTenant;
  const reflector = { getAllAndOverride: () => ["ADMIN"] };
  const guard = new TenantGuard(reflector, {
    set: (tenant) => { storedTenant = tenant; },
  });
  const request = requestWithMembership();

  assert.equal(guard.canActivate(executionContext(request)), true);
  assert.equal(request.tenant.businessId, "business-1");
  assert.deepEqual(storedTenant, request.tenant);
});
