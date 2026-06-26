const assert = require("node:assert/strict");
const { test } = require("node:test");
const { UnauthorizedException } = require("@nestjs/common");

const { IS_PUBLIC_KEY, REQUIRE_AUTH_KEY } = require("../dist/auth/auth.constants.js");
const { AuthGuard } = require("../dist/auth/auth.guard.js");
const { AppConfig } = require("../dist/common/config/app-config.js");
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
  request.body = { businessId: "business-desde-body" };
  request.query = { businessId: "business-desde-query" };

  assert.equal(guard.canActivate(executionContext(request)), true);
  assert.equal(request.tenant.businessId, "business-1");
  assert.deepEqual(storedTenant, request.tenant);
});

test("auth guard inyecta usuario dev cuando AUTH_REQUIRED=false aunque la ruta requiera auth", async () => {
  const request = {
    headers: {},
    params: { businessSlug: "barberia" },
  };
  const reflector = {
    getAllAndOverride: (key) => key === REQUIRE_AUTH_KEY,
  };
  const config = { authRequired: false };
  const jwt = {
    verify: async () => {
      throw new Error("No debe validar JWT con AUTH_REQUIRED=false.");
    },
  };
  const identity = {
    resolve: async () => {
      throw new Error("No debe resolver identidad con AUTH_REQUIRED=false.");
    },
  };
  const guard = new AuthGuard(reflector, config, jwt, identity);

  assert.equal(await guard.canActivate(executionContext(request)), true);
  assert.equal(request.user.id, "seed-user-demo-owner");
  assert.equal(
    request.user.memberships.some((membership) => membership.businessSlug === "barberia"),
    true,
  );
});

test("auth guard mantiene token Bearer requerido cuando AUTH_REQUIRED=true", async () => {
  const request = {
    headers: {},
    params: { businessSlug: "barberia" },
  };
  const reflector = {
    getAllAndOverride: (key) => key === IS_PUBLIC_KEY ? false : key === REQUIRE_AUTH_KEY,
  };
  const config = { authRequired: true };
  const guard = new AuthGuard(reflector, config, {}, {});

  await assert.rejects(
    () => guard.canActivate(executionContext(request)),
    (error) => error.getStatus() === 401
      && error.getResponse().code === "AUTH_TOKEN_MISSING",
  );
});

test("auth guard rechaza token invalido cuando AUTH_REQUIRED=true", async () => {
  const request = {
    headers: { authorization: "Bearer token-invalido" },
    params: { businessSlug: "barberia" },
  };
  const reflector = {
    getAllAndOverride: (key) => key === IS_PUBLIC_KEY ? false : key === REQUIRE_AUTH_KEY,
  };
  const config = { authRequired: true };
  let verifyCalled = false;
  const jwt = {
    verify: async (token) => {
      verifyCalled = true;
      assert.equal(token, "token-invalido");
      throw new UnauthorizedException({
        code: "AUTH_TOKEN_INVALID",
        message: "Token invalido.",
      });
    },
  };
  const identity = {
    resolve: async () => {
      throw new Error("No debe resolver identidad con token invalido.");
    },
  };
  const guard = new AuthGuard(reflector, config, jwt, identity);

  await assert.rejects(
    () => guard.canActivate(executionContext(request)),
    (error) => error.getStatus() === 401
      && error.getResponse().code === "AUTH_TOKEN_INVALID",
  );
  assert.equal(verifyCalled, true);
  assert.equal(request.user, undefined);
});

test("app config bloquea AUTH_REQUIRED=false en production", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_REQUIRED: process.env.AUTH_REQUIRED,
  };

  process.env.NODE_ENV = "production";
  process.env.AUTH_REQUIRED = "false";

  try {
    assert.throws(
      () => new AppConfig(),
      /AUTH_REQUIRED=false no está permitido en production/,
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
